import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, radius, spacing } from '@/constants/theme';
import type { Coordinate, TravelSpot } from '@/domain/recommendation/types';
import type { RouteSummary } from '@/domain/routing/types';

const viewBoxWidth = 100;
const viewBoxHeight = 72;
const padding = 8;
const maxPolylinePoints = 72;

type RouteMiniMapProps = {
  baselineRoute: RouteSummary;
  waypointRoute: RouteSummary;
  spot: TravelSpot;
  detourMinutes: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

function samplePolyline(polyline: Coordinate[]) {
  if (polyline.length <= maxPolylinePoints) return polyline;

  const sampled: Coordinate[] = [];
  const lastIndex = polyline.length - 1;

  for (let index = 0; index < maxPolylinePoints; index += 1) {
    sampled.push(polyline[Math.round((lastIndex * index) / (maxPolylinePoints - 1))]);
  }

  return sampled;
}

function routePoints(route: RouteSummary, fallback: Coordinate[]) {
  return route.polyline.length >= 2 ? samplePolyline(route.polyline) : fallback;
}

function coordinateKey(point: Coordinate) {
  return `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
}

function projectPoints(points: Coordinate[]) {
  const referenceLatitude =
    points.reduce((sum, point) => sum + point.latitude, 0) / Math.max(1, points.length);
  const longitudeScale = Math.cos((referenceLatitude * Math.PI) / 180);
  const projected = points.map((point) => ({
    x: point.longitude * longitudeScale,
    y: point.latitude,
  }));
  const xs = projected.map((point) => point.x);
  const ys = projected.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(0.00001, maxX - minX);
  const spanY = Math.max(0.00001, maxY - minY);
  const drawableWidth = viewBoxWidth - padding * 2;
  const drawableHeight = viewBoxHeight - padding * 2;

  return {
    toCanvas(point: Coordinate): ProjectedPoint {
      const projectedX = point.longitude * longitudeScale;
      const projectedY = point.latitude;

      return {
        x: padding + ((projectedX - minX) / spanX) * drawableWidth,
        y: viewBoxHeight - padding - ((projectedY - minY) / spanY) * drawableHeight,
      };
    },
  };
}

function pathFromPoints(points: Coordinate[], toCanvas: (point: Coordinate) => ProjectedPoint) {
  return points
    .map((point, index) => {
      const projected = toCanvas(point);
      const command = index === 0 ? 'M' : 'L';

      return `${command} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(' ');
}

function dedupeCoordinates(points: Coordinate[]) {
  const deduped = new Map<string, Coordinate>();

  for (const point of points) {
    deduped.set(coordinateKey(point), point);
  }

  return [...deduped.values()];
}

export function RouteMiniMap({ baselineRoute, waypointRoute, spot, detourMinutes }: RouteMiniMapProps) {
  const fallbackWaypoint = [baselineRoute.polyline[0], spot.coordinate, baselineRoute.polyline.at(-1)].filter(
    Boolean,
  ) as Coordinate[];
  const baselinePoints = routePoints(baselineRoute, fallbackWaypoint);
  const waypointPoints = routePoints(waypointRoute, fallbackWaypoint);
  const origin = baselinePoints[0] ?? waypointPoints[0] ?? spot.coordinate;
  const destination = baselinePoints.at(-1) ?? waypointPoints.at(-1) ?? spot.coordinate;

  const visual = useMemo(() => {
    const allPoints = dedupeCoordinates([...baselinePoints, ...waypointPoints, origin, spot.coordinate, destination]);
    const projection = projectPoints(allPoints);

    return {
      baselinePath: pathFromPoints(baselinePoints, projection.toCanvas),
      waypointPath: pathFromPoints(waypointPoints, projection.toCanvas),
      origin: projection.toCanvas(origin),
      spot: projection.toCanvas(spot.coordinate),
      destination: projection.toCanvas(destination),
    };
  }, [baselinePoints, waypointPoints, origin, spot.coordinate, destination]);

  return (
    <View
      accessibilityLabel={`기본 경로 ${baselineRoute.durationMinutes}분, 경유 경로 ${waypointRoute.durationMinutes}분, 추가 ${detourMinutes}분`}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>경로 차이</Text>
        <Text style={styles.detour}>+{detourMinutes}분</Text>
      </View>
      <View style={styles.mapFrame}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
          <Path
            d={visual.baselinePath}
            fill="none"
            stroke={colors.primary}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.8}
            opacity={0.72}
          />
          <Path
            d={visual.waypointPath}
            fill="none"
            stroke={colors.accent}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
            opacity={0.92}
          />
          <Circle cx={visual.origin.x} cy={visual.origin.y} r={3.2} fill={colors.primaryDark} />
          <Circle cx={visual.destination.x} cy={visual.destination.y} r={3.2} fill={colors.blue} />
          <Circle cx={visual.spot.x} cy={visual.spot.y} r={5} fill="#FFFFFF" stroke={colors.accent} strokeWidth={2.2} />
        </Svg>
      </View>
      <View style={styles.legend}>
        <LegendItem color={colors.primary} label={`기본 ${baselineRoute.durationMinutes}분`} dashed />
        <LegendItem color={colors.accent} label={`경유 ${waypointRoute.durationMinutes}분`} />
        <LegendItem color={colors.blue} label="목적지" />
      </View>
    </View>
  );
}

function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendLine, { backgroundColor: dashed ? 'transparent' : color }]}>
        <View style={[styles.legendSegment, { backgroundColor: color }]} />
        {dashed ? <View style={[styles.legendSegment, { backgroundColor: color }]} /> : null}
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  detour: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  mapFrame: {
    height: 126,
    overflow: 'hidden',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: '#FBFCF8',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendLine: {
    width: 22,
    height: 4,
    flexDirection: 'row',
    gap: 3,
    borderRadius: 2,
  },
  legendSegment: {
    flex: 1,
    borderRadius: 2,
  },
  legendText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
});
