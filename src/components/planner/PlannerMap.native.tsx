import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Line } from 'react-native-svg';

import { colors, shadow } from '@/constants/theme';
import type { Coordinate } from '@/domain/recommendation/types';

import {
  getPlannerMapAccessibilityLabel,
  getPlannerMapPoints,
  getPlannerMapRegion,
  isValidCoordinate,
  projectCoordinate,
  type PlannerMapRegion,
} from './PlannerMap.shared';
import type { PlannerMapProps } from './PlannerMap.types';

type NativeMarker = {
  id: string;
  coordinate: Coordinate;
  label: string;
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

function getNativeMarkers(props: PlannerMapProps): NativeMarker[] {
  const markers: NativeMarker[] = [];

  if (isValidCoordinate(props.baseCoordinate)) {
    markers.push({ id: 'base', coordinate: props.baseCoordinate, label: 'B', variant: 'base' });
  }

  if (isValidCoordinate(props.originCoordinate)) {
    markers.push({ id: 'origin', coordinate: props.originCoordinate, label: 'O', variant: 'origin' });
  }

  if (isValidCoordinate(props.destinationCoordinate)) {
    markers.push({ id: 'destination', coordinate: props.destinationCoordinate, label: 'D', variant: 'destination' });
  }

  props.candidateMarkers?.forEach((marker, index) => {
    if (!isValidCoordinate(marker.coordinate)) return;

    markers.push({
      id: `candidate-${marker.id}`,
      coordinate: marker.coordinate,
      label: String(index + 1),
      variant: 'candidate',
      highlighted: marker.id === props.highlightedCandidateId,
    });
  });

  return markers;
}

export function PlannerMap(props: PlannerMapProps) {
  const { baseCoordinate, candidateMarkers = [], destinationCoordinate, originCoordinate, style, testID } = props;
  const mapPoints = getPlannerMapPoints({ baseCoordinate, candidateMarkers, destinationCoordinate, originCoordinate });
  const region = getPlannerMapRegion(mapPoints);
  const markers = getNativeMarkers(props);
  const routeStart = isValidCoordinate(originCoordinate) ? projectCoordinate(originCoordinate, region) : null;
  const routeEnd = isValidCoordinate(destinationCoordinate) ? projectCoordinate(destinationCoordinate, region) : null;

  return (
    <View
      accessibilityLabel={getPlannerMapAccessibilityLabel(props)}
      accessibilityRole="image"
      pointerEvents="none"
      style={[styles.backdrop, style]}
      testID={testID}
    >
      <View style={styles.staticMap}>
        <View style={[styles.landPatch, styles.landPatchNorth]} />
        <View style={[styles.landPatch, styles.landPatchSouth]} />
        <View style={styles.water} />
        <View style={[styles.road, styles.roadPrimary]} />
        <View style={[styles.road, styles.roadSecondary]} />
        <View style={[styles.road, styles.roadTertiary]} />
        <View style={[styles.road, styles.roadThin]} />
      </View>
      <WebView
        originWhitelist={['https://www.openstreetmap.org']}
        pointerEvents="none"
        source={{ uri: buildOpenStreetMapBackdropUrl(region) }}
        style={styles.webMap}
      />
      <View style={styles.mapWash} />
      {routeStart && routeEnd ? (
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
        {markers.map((marker) => {
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
  webMap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.68,
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
