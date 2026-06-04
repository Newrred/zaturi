import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import ZaturiKakaoMapView from '../../modules/zaturi-kakao-map/src/ZaturiKakaoMapView';
import { colors, radius, spacing } from '@/constants/theme';
import type { TravelSpot } from '@/domain/recommendation/types';
import { buildOpenStreetMapEmbedUrl, buildOpenStreetMapViewUrl } from '@/utils/openStreetMap';

const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim();

export function SpotMap({ spot }: { spot: TravelSpot }) {
  const [mapError, setMapError] = useState<string | null>(null);

  if (!kakaoNativeAppKey) {
    return <OpenStreetMapFallback spot={spot} />;
  }

  if (mapError) {
    return <OpenStreetMapFallback spot={spot} fallbackReason={mapError} />;
  }

  return (
    <View style={styles.wrapper}>
      <ZaturiKakaoMapView
        appKey={kakaoNativeAppKey}
        latitude={spot.coordinate.latitude}
        longitude={spot.coordinate.longitude}
        subtitle={spot.address}
        title={spot.name}
        zoomLevel={15}
        onMapError={(event) => {
          const message = event.nativeEvent.message || 'Kakao map failed to load.';
          console.warn(`[ZaturiKakaoMap] ${event.nativeEvent.code}: ${message}`);
          setMapError(message);
        }}
        onMapReady={() => {
          setMapError(null);
        }}
        style={styles.map}
      />
      <View style={styles.caption}>
        <Text style={styles.captionText}>Kakao Map</Text>
      </View>
    </View>
  );
}

function OpenStreetMapFallback({ spot, fallbackReason }: { spot: TravelSpot; fallbackReason?: string }) {
  return (
    <View style={styles.wrapper}>
      <WebView
        originWhitelist={['https://www.openstreetmap.org']}
        source={{ uri: buildOpenStreetMapEmbedUrl(spot.coordinate) }}
        style={styles.map}
      />
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL(buildOpenStreetMapViewUrl(spot.coordinate));
        }}
        style={styles.caption}
      >
        <Text style={styles.captionText}>{fallbackReason ? 'OSM fallback' : 'OpenStreetMap'}</Text>
      </Pressable>
      {fallbackReason ? (
        <View style={styles.errorBanner}>
          <Text numberOfLines={2} style={styles.errorText}>
            Kakao map unavailable. Showing OSM preview.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 240,
    overflow: 'hidden',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  caption: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  captionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  errorBanner: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
});
