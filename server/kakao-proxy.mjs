import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mapTourApiItemToTravelSpot, rankRouteCandidates, selectTourApiCandidates } from './recommendation/tour-candidate-policy.mjs';

const localApiBaseUrl = 'https://dapi.kakao.com';
const mobilityApiBaseUrl = 'https://apis-navi.kakaomobility.com';
const tourApiBaseUrl = 'http://apis.data.go.kr/B551011/KorService2/';
const defaultPort = 3000;
const defaultAllowedOrigins = ['http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:8082', 'http://127.0.0.1:8082'];
const metersPerDegreeLat = 111_320;

loadEnvFile('.env');
loadEnvFile('.env.local');
loadEnvFile('.env.proxy.local');

const port = Number(process.env.PORT ?? process.env.KAKAO_PROXY_PORT ?? defaultPort);
const apiKey = process.env.KAKAO_REST_API_KEY;
const tourApiKey = process.env.TOUR_API_SERVICE_KEY;
const allowedOrigins = (process.env.KAKAO_PROXY_ALLOWED_ORIGINS ?? defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const candidateCorridorMeters = Number(process.env.KAKAO_ROUTE_CANDIDATE_CORRIDOR_METERS ?? 20_000);
const waypointCandidateLimit = Number(process.env.KAKAO_ROUTE_WAYPOINT_CANDIDATE_LIMIT ?? 8);
const waypointConcurrency = Number(process.env.KAKAO_ROUTE_WAYPOINT_CONCURRENCY ?? 3);
const tourApiRouteSampleLimit = Number(process.env.TOUR_API_ROUTE_SAMPLE_LIMIT ?? 6);
const tourApiCandidateLimit = Number(process.env.TOUR_API_CANDIDATE_LIMIT ?? 40);
const tourApiSearchRadiusMeters = Number(process.env.TOUR_API_SEARCH_RADIUS_METERS ?? 12_000);

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);

  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = stripQuotes(rawValue);
  }
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function sendJson(req, res, statusCode, payload) {
  applyCors(req, res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendNoContent(req, res) {
  applyCors(req, res);
  res.writeHead(204);
  res.end();
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  return JSON.parse(raw);
}

function requireApiKey(req, res) {
  if (apiKey) return true;

  sendJson(req, res, 503, {
    error: 'KAKAO_REST_API_KEY_MISSING',
    message: 'Set KAKAO_REST_API_KEY in .env.local or .env.proxy.local and restart the proxy.',
  });
  return false;
}

function requireTourApiKey(req, res) {
  if (tourApiKey) return true;

  sendJson(req, res, 503, {
    error: 'TOUR_API_SERVICE_KEY_MISSING',
    message: 'Set TOUR_API_SERVICE_KEY in .env or .env.proxy.local and restart the proxy.',
  });
  return false;
}

function coordinateParam(coordinate, name) {
  const base = `${coordinate.longitude},${coordinate.latitude}`;
  return name ? `${base},name=${encodeURIComponent(name)}` : base;
}

function kakaoHeaders(hasBody = false) {
  return {
    Authorization: `KakaoAK ${apiKey}`,
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
  };
}

function withSearchParams(pathname, params) {
  const url = new URL(pathname, localApiBaseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

async function proxyKakaoGet(req, res, url) {
  const response = await fetch(url, {
    headers: kakaoHeaders(),
  });
  const data = await response.json();

  sendJson(req, res, response.status, data);
}

async function tourApiGet(pathname, params) {
  const url = new URL(pathname.replace(/^\//, ''), tourApiBaseUrl);

  for (const [key, value] of Object.entries({
    MobileOS: 'ETC',
    MobileApp: 'Zaturi',
    _type: 'json',
    ...params,
  })) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  const serviceKey = String(tourApiKey ?? '');
  const serviceKeyParam = serviceKey.includes('%') ? serviceKey : encodeURIComponent(serviceKey);
  const requestUrl = `${url.toString()}&serviceKey=${serviceKeyParam}`;

  const response = await fetch(requestUrl);
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new TourApiProxyError(response.status, data);
  }

  return data;
}

async function kakaoMobilityGet(pathname, params) {
  const url = new URL(pathname, mobilityApiBaseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: kakaoHeaders(),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new KakaoProxyError(response.status, data);
  }

  return data;
}

async function kakaoMobilityPost(pathname, body) {
  const response = await fetch(new URL(pathname, mobilityApiBaseUrl), {
    method: 'POST',
    headers: kakaoHeaders(true),
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new KakaoProxyError(response.status, data);
  }

  return data;
}

class KakaoProxyError extends Error {
  constructor(statusCode, details) {
    super('Kakao upstream request failed');
    this.statusCode = statusCode;
    this.details = details;
  }
}

class TourApiProxyError extends Error {
  constructor(statusCode, details) {
    super('TourAPI upstream request failed');
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeDirectionRoute(route, fallbackOrigin, fallbackDestination) {
  const summary = route?.summary ?? {};
  const polyline = extractPolyline(route?.sections) ?? [fallbackOrigin, fallbackDestination];
  const distanceMeters = Number(summary.distance ?? 0);
  const durationMinutes = Math.max(1, Math.ceil(Number(summary.duration ?? 0) / 60));

  return {
    distanceMeters,
    durationMinutes,
    polyline,
    tollFare: Number(summary.fare?.toll ?? 0),
  };
}

function extractPolyline(sections) {
  if (!Array.isArray(sections)) return null;

  const polyline = [];

  for (const section of sections) {
    const roads = Array.isArray(section?.roads) ? section.roads : [];

    for (const road of roads) {
      const vertexes = Array.isArray(road?.vertexes) ? road.vertexes : [];

      for (let index = 0; index < vertexes.length - 1; index += 2) {
        polyline.push({
          longitude: Number(vertexes[index]),
          latitude: Number(vertexes[index + 1]),
        });
      }
    }
  }

  return polyline.length > 1 ? polyline : null;
}

function toXY(point, reference) {
  const latRadians = (reference.latitude * Math.PI) / 180;

  return {
    x: (point.longitude - reference.longitude) * metersPerDegreeLat * Math.cos(latRadians),
    y: (point.latitude - reference.latitude) * metersPerDegreeLat,
  };
}

function distanceToSegmentMeters(point, start, end) {
  const reference = {
    latitude: (start.latitude + end.latitude) / 2,
    longitude: (start.longitude + end.longitude) / 2,
  };
  const p = toXY(point, reference);
  const a = toXY(start, reference);
  const b = toXY(end, reference);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));

  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function distanceToPolylineMeters(point, polyline) {
  if (polyline.length < 2) return 0;

  let shortest = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    shortest = Math.min(shortest, distanceToSegmentMeters(point, polyline[index], polyline[index + 1]));
  }

  return Math.round(shortest);
}

function confidenceForDistance(distanceMeters) {
  if (distanceMeters <= 6_000) return 'high';
  if (distanceMeters <= 18_000) return 'medium';
  return 'low';
}

function samplePolyline(polyline, limit) {
  if (polyline.length <= limit) return polyline;

  const sampled = [];
  const lastIndex = polyline.length - 1;

  for (let index = 0; index < limit; index += 1) {
    const targetIndex = Math.round((lastIndex * index) / (limit - 1));
    sampled.push(polyline[targetIndex]);
  }

  return sampled;
}

function tourApiItems(data) {
  const body = data?.response?.body;
  const resultCode = data?.response?.header?.resultCode;

  if (resultCode && resultCode !== '0000') {
    throw new TourApiProxyError(502, data.response.header);
  }

  const item = body?.items?.item;

  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function fetchTourApiSpotsForRoute(polyline) {
  if (!tourApiKey) return [];

  const sampledPoints = samplePolyline(polyline, tourApiRouteSampleLimit);
  const deduped = new Map();

  for (const point of sampledPoints) {
    const data = await tourApiGet('/locationBasedList2', {
      numOfRows: 20,
      pageNo: 1,
      arrange: 'S',
      mapX: point.longitude,
      mapY: point.latitude,
      radius: tourApiSearchRadiusMeters,
    });

    for (const item of tourApiItems(data)) {
      if (!item?.contentid || deduped.has(String(item.contentid))) continue;

      const spot = mapTourApiItemToTravelSpot(item);
      if (spot && !spot.candidateMeta?.excluded) {
        deduped.set(String(item.contentid), spot);
      }
      if (deduped.size >= tourApiCandidateLimit) break;
    }

    if (deduped.size >= tourApiCandidateLimit) break;
  }

  return selectTourApiCandidates([...deduped.values()], tourApiCandidateLimit);
}

function sortCandidateSpotsByRouteFit(spots, baselinePolyline) {
  const routeCandidates = spots
    .map((spot) => ({
      ...spot,
      routeCorridorDistanceMeters: distanceToPolylineMeters(spot.coordinate, baselinePolyline),
    }))
    .filter((spot) => spot.routeCorridorDistanceMeters <= candidateCorridorMeters);

  return rankRouteCandidates(routeCandidates, waypointCandidateLimit);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

async function assessSpotWithWaypointRoute(origin, destination, spot, baselineRoute) {
  const response = await kakaoMobilityPost('/v1/waypoints/directions', {
    origin: toKakaoPoint(origin.coordinate, origin.name),
    destination: toKakaoPoint(destination.coordinate, destination.name),
    waypoints: [
      {
        ...toKakaoPoint(spot.coordinate, spot.name),
        name: spot.name,
      },
    ],
    priority: 'RECOMMEND',
    alternatives: false,
    road_details: false,
    summary: true,
  });
  const route = response?.routes?.[0];

  if (!route || route.result_code !== 0) {
    return null;
  }

  const summary = route.summary ?? {};
  const waypointDurationMinutes = Math.max(1, Math.ceil(Number(summary.duration ?? 0) / 60));
  const waypointDistanceMeters = Number(summary.distance ?? 0);
  const addedDriveMinutes = Math.max(0, waypointDurationMinutes - baselineRoute.durationMinutes);
  const addedDistanceMeters = Math.max(0, waypointDistanceMeters - baselineRoute.distanceMeters);
  const sections = Array.isArray(route.sections) ? route.sections : [];
  const driveToSpotMinutes = Math.max(1, Math.ceil(Number(sections[0]?.duration ?? summary.duration ?? 0) / 60));
  const driveFromSpotMinutes = Math.max(1, Math.ceil(Number(sections[1]?.duration ?? 0) / 60));

  return {
    spotId: spot.id,
    routeCorridorDistanceMeters: spot.routeCorridorDistanceMeters,
    driveToSpotMinutes,
    driveFromSpotMinutes,
    waypointDurationMinutes,
    waypointDistanceMeters,
    addedDriveMinutes,
    addedDistanceMeters,
    confidence: confidenceForDistance(spot.routeCorridorDistanceMeters),
    sourceLabel: 'Kakao Mobility Waypoint Directions API',
  };
}

async function buildCandidateRoutePlan(body) {
  const { origin, destination, spots, preferTourApi } = body;

  if (!origin?.coordinate || !destination?.coordinate) {
    throw new RequestError(400, 'INVALID_ROUTE_CANDIDATE_REQUEST', 'origin and destination are required.');
  }

  const baseline = await kakaoMobilityGet('/v1/directions', {
    origin: coordinateParam(origin.coordinate, origin.name),
    destination: coordinateParam(destination.coordinate, destination.name),
    priority: 'RECOMMEND',
    alternatives: 'false',
    road_details: 'false',
    summary: 'false',
  });
  const baselineRoute = normalizeDirectionRoute(baseline.routes?.[0], origin.coordinate, destination.coordinate);
  const fallbackSpots = Array.isArray(spots) ? spots : [];
  let candidateSpots = fallbackSpots;

  if (preferTourApi && tourApiKey) {
    try {
      const tourApiSpots = await fetchTourApiSpotsForRoute(baselineRoute.polyline);
      if (tourApiSpots.length > 0) {
        candidateSpots = tourApiSpots;
      }
    } catch {
      candidateSpots = fallbackSpots;
    }
  }

  const routeFitCandidates = sortCandidateSpotsByRouteFit(candidateSpots, baselineRoute.polyline);
  const assessments = (
    await mapWithConcurrency(routeFitCandidates, waypointConcurrency, async (spot) => {
      try {
        return await assessSpotWithWaypointRoute(origin, destination, spot, baselineRoute);
      } catch {
        return null;
      }
    })
  ).filter(Boolean);

  return {
    providerLabel: 'Kakao Mobility Directions API',
    isLive: true,
    baselineRoute: {
      id: `${origin.name}-${destination.name}-kakao-base`,
      originName: origin.name,
      destinationName: destination.name,
      distanceMeters: baselineRoute.distanceMeters,
      durationMinutes: baselineRoute.durationMinutes,
      polyline: baselineRoute.polyline,
      tollFare: baselineRoute.tollFare,
      trafficLabel: '카카오 현재 교통 기준',
      providerMode: 'kakaoProxy',
      sourceLabel: 'Kakao Mobility Directions API',
    },
    spots: candidateSpots,
    assessments,
  };
}

function toKakaoPoint(coordinate, name) {
  return {
    ...(name ? { name } : {}),
    x: String(coordinate.longitude),
    y: String(coordinate.latitude),
  };
}

class RequestError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendNoContent(req, res);
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(req, res, 200, {
      ok: true,
      hasKakaoRestApiKey: Boolean(apiKey),
      hasTourApiServiceKey: Boolean(tourApiKey),
      allowedOrigins,
    });
    return;
  }

  if (!requireApiKey(req, res)) return;

  if (req.method === 'GET' && url.pathname === '/api/kakao/local/keyword') {
    await proxyKakaoGet(
      req,
      res,
      withSearchParams('/v2/local/search/keyword.json', Object.fromEntries(url.searchParams.entries())),
    );
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/kakao/local/address') {
    await proxyKakaoGet(
      req,
      res,
      withSearchParams('/v2/local/search/address.json', Object.fromEntries(url.searchParams.entries())),
    );
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/tour/location') {
    if (!requireTourApiKey(req, res)) return;

    sendJson(req, res, 200, await tourApiGet('/locationBasedList2', Object.fromEntries(url.searchParams.entries())));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/kakao/mobility/directions') {
    const body = await readJsonBody(req);
    sendJson(req, res, 200, await kakaoMobilityGet('/v1/directions', body));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/kakao/mobility/origins') {
    sendJson(req, res, 200, await kakaoMobilityPost('/v1/origins/directions', await readJsonBody(req)));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/kakao/mobility/destinations') {
    sendJson(req, res, 200, await kakaoMobilityPost('/v1/destinations/directions', await readJsonBody(req)));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/kakao/mobility/waypoints') {
    sendJson(req, res, 200, await kakaoMobilityPost('/v1/waypoints/directions', await readJsonBody(req)));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/routes/candidates') {
    sendJson(req, res, 200, await buildCandidateRoutePlan(await readJsonBody(req)));
    return;
  }

  sendJson(req, res, 404, {
    error: 'NOT_FOUND',
    message: `${req.method} ${url.pathname} is not supported.`,
  });
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    if (error instanceof RequestError) {
      sendJson(req, res, error.statusCode, {
        error: error.code,
        message: error.message,
      });
      return;
    }

    if (error instanceof KakaoProxyError) {
      sendJson(req, res, error.statusCode, {
        error: 'KAKAO_UPSTREAM_ERROR',
        details: error.details,
      });
      return;
    }

    if (error instanceof TourApiProxyError) {
      sendJson(req, res, error.statusCode, {
        error: 'TOUR_API_UPSTREAM_ERROR',
        details: error.details,
      });
      return;
    }

    sendJson(req, res, 500, {
      error: 'INTERNAL_PROXY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  });
});

server.listen(port, () => {
  console.log(`Kakao proxy listening on port ${port}`);
  console.log(apiKey ? 'Kakao REST API key loaded.' : 'KAKAO_REST_API_KEY is not set. Live Kakao calls will return 503.');
  console.log(tourApiKey ? 'TourAPI service key loaded.' : 'TOUR_API_SERVICE_KEY is not set. TourAPI calls will return 503.');
});
