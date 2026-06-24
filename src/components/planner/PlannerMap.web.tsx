import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors, shadow } from '@/constants/theme';
import type { Coordinate } from '@/domain/recommendation/types';

import {
  coordinateKey,
  getPlannerMapAccessibilityLabel,
  getPlannerMapPoints,
  getPlannerMapRegion,
  isValidCoordinate,
  projectCoordinate,
  type PlannerMapRegion,
} from './PlannerMap.shared';
import type { PlannerMapProps } from './PlannerMap.types';

const iframeStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 0,
  opacity: 0.68,
};

const kakaoMapStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
};

const kakaoJavascriptKey = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();

type MapDrawable = {
  setMap: (map: unknown | null) => void;
};

type KakaoMapsApi = {
  maps: {
    load: (callback: () => void) => void;
    LatLng: new (latitude: number, longitude: number) => unknown;
    LatLngBounds: new () => { extend: (point: unknown) => void };
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
      setBounds: (bounds: unknown) => void;
      setDraggable: (draggable: boolean) => void;
      setZoomable: (zoomable: boolean) => void;
    };
    CustomOverlay: new (options: { content: string; map: unknown; position: unknown; xAnchor?: number; yAnchor?: number }) => MapDrawable;
    Polyline: new (options: { map: unknown; path: unknown[]; strokeColor: string; strokeOpacity: number; strokeStyle: string; strokeWeight: number }) => MapDrawable;
    event?: {
      trigger: (target: unknown, eventName: string) => void;
    };
  };
};

declare global {
  interface Window {
    kakao?: KakaoMapsApi;
    __zaturiKakaoMapSdkPromise?: Promise<void>;
  }
}

type WebMarker = {
  id: string;
  coordinate: Coordinate;
  label: string;
  title: string;
  variant: 'base' | 'candidate' | 'destination' | 'origin';
  highlighted?: boolean;
};

function fixedCoordinate(value: number) {
  return value.toFixed(6);
}

function buildOpenStreetMapBackdropUrl(region: PlannerMapRegion) {
  const left = fixedCoordinate(region.longitude - region.longitudeDelta / 2);
  const bottom = fixedCoordinate(region.latitude - region.latitudeDelta / 2);
  const right = fixedCoordinate(region.longitude + region.longitudeDelta / 2);
  const top = fixedCoordinate(region.latitude + region.latitudeDelta / 2);
  const latitude = fixedCoordinate(region.latitude);
  const longitude = fixedCoordinate(region.longitude);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function loadKakaoMapsSdk(appKey: string) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Kakao Maps SDK is only available in the browser.'));
  if (window.kakao?.maps) {
    return new Promise<void>((resolve) => {
      window.kakao?.maps.load(resolve);
    });
  }

  if (!window.__zaturiKakaoMapSdkPromise) {
    window.__zaturiKakaoMapSdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
      script.onload = () => {
        window.kakao?.maps.load(resolve);
      };
      script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK.'));
      document.head.appendChild(script);
    });
  }

  return window.__zaturiKakaoMapSdkPromise;
}

function getKakaoLevel(region: PlannerMapRegion) {
  const span = Math.max(region.latitudeDelta, region.longitudeDelta);

  if (span < 0.015) return 3;
  if (span < 0.04) return 5;
  if (span < 0.12) return 7;
  if (span < 0.35) return 9;
  if (span < 0.9) return 11;
  return 13;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getKakaoMarkerColor(marker: WebMarker) {
  if (marker.highlighted) return colors.primary;

  switch (marker.variant) {
    case 'base':
      return colors.primaryDark;
    case 'origin':
      return colors.success;
    case 'destination':
      return colors.blue;
    case 'candidate':
    default:
      return colors.accent;
  }
}

function buildKakaoMarkerContent(marker: WebMarker) {
  const size = marker.highlighted ? 34 : 28;
  const radius = size / 2;

  return `
    <div title="${escapeHtml(marker.title)}" style="
      width:${size}px;
      height:${size}px;
      border-radius:${radius}px;
      border:2px solid #fff;
      background:${getKakaoMarkerColor(marker)};
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:12px;
      font-weight:900;
      box-shadow:0 8px 18px rgba(30, 26, 20, 0.18);
      transform:translateY(-2px);
      user-select:none;
    ">${escapeHtml(marker.label)}</div>
  `;
}

function getWebMarkers(props: PlannerMapProps): WebMarker[] {
  const markers: WebMarker[] = [];

  if (isValidCoordinate(props.baseCoordinate)) {
    markers.push({
      id: 'base',
      coordinate: props.baseCoordinate,
      label: 'B',
      title: 'Base',
      variant: 'base',
    });
  }

  if (isValidCoordinate(props.originCoordinate)) {
    markers.push({
      id: 'origin',
      coordinate: props.originCoordinate,
      label: 'O',
      title: 'Origin',
      variant: 'origin',
    });
  }

  if (isValidCoordinate(props.destinationCoordinate)) {
    markers.push({
      id: 'destination',
      coordinate: props.destinationCoordinate,
      label: 'D',
      title: 'Destination',
      variant: 'destination',
    });
  }

  props.candidateMarkers?.forEach((marker, index) => {
    if (!isValidCoordinate(marker.coordinate)) return;

    markers.push({
      id: `candidate-${marker.id}`,
      coordinate: marker.coordinate,
      label: String(index + 1),
      title: marker.title ?? `Candidate ${index + 1}`,
      variant: 'candidate',
      highlighted: marker.id === props.highlightedCandidateId,
    });
  });

  return markers;
}

export function PlannerMap(props: PlannerMapProps) {
  const {
    baseCoordinate,
    candidateMarkers = [],
    destinationCoordinate,
    interactive = false,
    originCoordinate,
    style,
    testID,
  } = props;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [kakaoStatus, setKakaoStatus] = useState<'fallback' | 'loading' | 'ready'>(
    kakaoJavascriptKey ? 'loading' : 'fallback',
  );
  const mapPoints = useMemo(
    () => getPlannerMapPoints({ baseCoordinate, candidateMarkers, destinationCoordinate, originCoordinate }),
    [baseCoordinate, candidateMarkers, destinationCoordinate, originCoordinate],
  );
  const region = useMemo(() => getPlannerMapRegion(mapPoints), [mapPoints]);
  const markers = useMemo(() => getWebMarkers(props), [props]);
  const mapPointSignature = mapPoints.map(coordinateKey).join('|');
  const markerSignature = markers
    .map((marker) => `${marker.id}:${coordinateKey(marker.coordinate)}:${marker.label}:${marker.highlighted ? '1' : '0'}`)
    .join('|');
  const iframePointerEvents = interactive ? 'auto' : 'none';
  const routeStart = isValidCoordinate(originCoordinate) ? projectCoordinate(originCoordinate, region) : null;
  const routeEnd = isValidCoordinate(destinationCoordinate) ? projectCoordinate(destinationCoordinate, region) : null;
  const shouldUseFallbackMap = kakaoStatus !== 'ready';

  useEffect(() => {
    if (!kakaoJavascriptKey) {
      setKakaoStatus('fallback');
      return;
    }

    const container = mapContainerRef.current;
    if (!container) return;

    let disposed = false;
    let drawables: MapDrawable[] = [];

    setKakaoStatus('loading');

    void loadKakaoMapsSdk(kakaoJavascriptKey)
      .then(() => {
        if (disposed || !window.kakao?.maps) return;

        const kakao = window.kakao;
        const center = new kakao.maps.LatLng(region.latitude, region.longitude);
        const map = new kakao.maps.Map(container, {
          center,
          level: getKakaoLevel(region),
        });
        map.setDraggable(interactive);
        map.setZoomable(interactive);

        if (mapPoints.length > 1) {
          const bounds = new kakao.maps.LatLngBounds();
          for (const point of mapPoints) {
            bounds.extend(new kakao.maps.LatLng(point.latitude, point.longitude));
          }
          map.setBounds(bounds);
        }

        for (const marker of markers) {
          const position = new kakao.maps.LatLng(marker.coordinate.latitude, marker.coordinate.longitude);
          drawables.push(
            new kakao.maps.CustomOverlay({
              content: buildKakaoMarkerContent(marker),
              map,
              position,
              xAnchor: 0.5,
              yAnchor: 0.5,
            }),
          );
        }

        if (isValidCoordinate(originCoordinate) && isValidCoordinate(destinationCoordinate)) {
          drawables.push(
            new kakao.maps.Polyline({
              map,
              path: [
                new kakao.maps.LatLng(originCoordinate.latitude, originCoordinate.longitude),
                new kakao.maps.LatLng(destinationCoordinate.latitude, destinationCoordinate.longitude),
              ],
              strokeColor: colors.blue,
              strokeOpacity: 0.86,
              strokeStyle: 'dash',
              strokeWeight: 4,
            }),
          );
        }

        window.requestAnimationFrame(() => {
          kakao.maps.event?.trigger(map, 'resize');
        });
        setKakaoStatus('ready');
      })
      .catch(() => {
        if (!disposed) setKakaoStatus('fallback');
      });

    return () => {
      disposed = true;
      for (const drawable of drawables) {
        drawable.setMap(null);
      }
      drawables = [];
    };
  }, [
    destinationCoordinate,
    interactive,
    mapPointSignature,
    markerSignature,
    originCoordinate,
    region.latitude,
    region.latitudeDelta,
    region.longitude,
    region.longitudeDelta,
  ]);

  return (
    <View
      accessibilityLabel={getPlannerMapAccessibilityLabel(props)}
      accessibilityRole="image"
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[styles.backdrop, style]}
      testID={testID}
    >
      <View pointerEvents="none" style={styles.staticMap}>
        <View style={[styles.landPatch, styles.landPatchNorth]} />
        <View style={[styles.landPatch, styles.landPatchSouth]} />
        <View style={styles.water} />
        <View style={[styles.road, styles.roadPrimary]} />
        <View style={[styles.road, styles.roadSecondary]} />
        <View style={[styles.road, styles.roadTertiary]} />
        <View style={[styles.road, styles.roadThin]} />
      </View>
      {shouldUseFallbackMap ? (
        <iframe
          loading="lazy"
          sandbox="allow-scripts allow-popups"
          src={buildOpenStreetMapBackdropUrl(region)}
          style={{ ...iframeStyle, pointerEvents: iframePointerEvents }}
          title="Planner map backdrop"
        />
      ) : null}
      <div ref={mapContainerRef} style={{ ...kakaoMapStyle, opacity: kakaoStatus === 'ready' ? 0.78 : 0, pointerEvents: iframePointerEvents }} />
      <View pointerEvents="none" style={styles.mapWash} />
      {shouldUseFallbackMap && routeStart && routeEnd ? (
        <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFillObject} width="100%">
          <Line
            stroke={colors.blue}
            strokeDasharray="8 8"
            strokeLinecap="round"
            strokeWidth={3}
            x1={`${routeStart.left}%`}
            x2={`${routeEnd.left}%`}
            y1={`${routeStart.top}%`}
            y2={`${routeEnd.top}%`}
          />
        </Svg>
      ) : null}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {shouldUseFallbackMap && markers.map((marker) => {
          const position = projectCoordinate(marker.coordinate, region);

          return (
            <View
              key={marker.id}
              style={[
                styles.marker,
                styles[`${marker.variant}Marker`],
                marker.highlighted ? styles.highlightedMarker : null,
                {
                  left: `${position.left}%`,
                  top: `${position.top}%`,
                },
              ]}
            >
              <Text style={styles.markerText}>{marker.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#DCE8DE',
  },
  staticMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DCE8DE',
  },
  landPatch: {
    position: 'absolute',
    borderRadius: 18,
    backgroundColor: '#BFD9B8',
    opacity: 0.58,
  },
  landPatchNorth: {
    top: '5%',
    left: '6%',
    width: '32%',
    height: '26%',
    transform: [{ rotate: '-10deg' }],
  },
  landPatchSouth: {
    right: '10%',
    bottom: '8%',
    width: '36%',
    height: '24%',
    transform: [{ rotate: '8deg' }],
  },
  water: {
    position: 'absolute',
    top: '16%',
    right: '-8%',
    width: '34%',
    height: '74%',
    borderRadius: 60,
    backgroundColor: '#A9CAD7',
    opacity: 0.72,
    transform: [{ rotate: '13deg' }],
  },
  road: {
    position: 'absolute',
    borderColor: 'rgba(160,150,132,0.62)',
    backgroundColor: '#FFFDF7',
  },
  roadPrimary: {
    left: '-12%',
    top: '48%',
    width: '128%',
    height: 12,
    borderWidth: 1,
    transform: [{ rotate: '-18deg' }],
  },
  roadSecondary: {
    left: '22%',
    top: '-10%',
    width: 10,
    height: '120%',
    borderWidth: 1,
    transform: [{ rotate: '21deg' }],
  },
  roadTertiary: {
    left: '-8%',
    top: '28%',
    width: '88%',
    height: 8,
    borderWidth: 1,
    transform: [{ rotate: '14deg' }],
  },
  roadThin: {
    right: '8%',
    bottom: '24%',
    width: '62%',
    height: 5,
    borderWidth: 0,
    opacity: 0.84,
    transform: [{ rotate: '-5deg' }],
  },
  mapWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,252,248,0.2)',
  },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    marginLeft: -14,
    borderColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    ...shadow.sm,
  },
  baseMarker: {
    backgroundColor: colors.primaryDark,
  },
  originMarker: {
    backgroundColor: colors.success,
  },
  destinationMarker: {
    backgroundColor: colors.blue,
  },
  candidateMarker: {
    backgroundColor: colors.accent,
  },
  highlightedMarker: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.14 }],
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
});
