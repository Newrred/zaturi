# Kakao API Proxy

Last updated: 2026-05-20

## Why This Exists

Kakao Local API and Kakao Mobility Directions API both require a REST API key in the `Authorization: KakaoAK ${REST_API_KEY}` header.

That key must stay server-side. Do not put it into Expo app code or any `EXPO_PUBLIC_` environment variable.

## Getting a Key

You need to create or use a Kakao Developers app and copy its REST API key.

High-level flow:

1. Log in to Kakao Developers.
2. Create an app for `자투리여행`.
3. Open the app's platform/key settings.
4. Copy the REST API key.
5. Put the value in local `.env` or `.env.proxy.local`:

```text
KAKAO_REST_API_KEY=your_rest_api_key_here
```

Kakao Mobility's guide also notes that service information must be registered before REST API calls are used.

## Running Locally

Start the proxy:

```powershell
npm run proxy:kakao
```

Then start Expo in another terminal:

```powershell
npm start
```

For web, this app can use:

```text
EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL=http://localhost:3000
```

For Android emulator, use:

```text
EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL=http://10.0.2.2:3000
```

For a physical phone, use the desktop's LAN IP instead of `localhost`.

## Proxy Endpoints

Health:

```text
GET /health
```

Kakao Local:

```text
GET /api/kakao/local/keyword?query=강릉역
GET /api/kakao/local/address?query=강원 강릉시
```

Kakao Mobility raw passthrough:

```text
POST /api/kakao/mobility/directions
POST /api/kakao/mobility/origins
POST /api/kakao/mobility/destinations
POST /api/kakao/mobility/waypoints
```

App-normalized recommendation route plan:

```text
POST /api/routes/candidates
```

The Expo app currently calls `/api/routes/candidates` when `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL` is set. If the proxy is unavailable or the key is missing, the app falls back to the Kakao-shaped mock route planner.

`/api/routes/candidates` uses this call strategy:

1. Call Kakao Mobility `GET /v1/directions` once for the baseline route.
2. Filter candidate spots by distance from the returned route polyline.
3. Keep only the closest candidates, controlled by `KAKAO_ROUTE_WAYPOINT_CANDIDATE_LIMIT`.
4. Call Kakao Mobility `POST /v1/waypoints/directions` for each selected candidate.
5. Limit concurrent waypoint calls with `KAKAO_ROUTE_WAYPOINT_CONCURRENCY`.
6. Return normalized added-drive-time assessments to the Expo app.

This avoids the long-distance `radius` limitation of the multi-origin/multi-destination APIs while keeping request volume bounded.

Tuning variables:

```text
KAKAO_ROUTE_CANDIDATE_CORRIDOR_METERS=20000
KAKAO_ROUTE_WAYPOINT_CANDIDATE_LIMIT=8
KAKAO_ROUTE_WAYPOINT_CONCURRENCY=3
```

## Official References

- Kakao Local API: https://developers.kakao.com/docs/latest/ko/local/dev-guide
- Kakao Mobility Directions API: https://developers.kakaomobility.com/guide/navi-api/directions
- Kakao Mobility getting started: https://developers.kakaomobility.com/guide/navi-api/start.html
