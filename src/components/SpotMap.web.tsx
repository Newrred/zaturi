import type { CSSProperties } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { TravelSpot } from '@/domain/recommendation/types';
import { buildOpenStreetMapEmbedUrl, buildOpenStreetMapViewUrl } from '@/utils/openStreetMap';

const iframeStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
};

export function SpotMap({ spot }: { spot: TravelSpot }) {
  return (
    <View style={styles.wrapper}>
      <iframe
        title={`${spot.name} 위치 지도`}
        src={buildOpenStreetMapEmbedUrl(spot.coordinate)}
        style={iframeStyle}
        loading="lazy"
        sandbox="allow-scripts allow-popups"
      />
      <View style={styles.caption}>
        <Text style={styles.captionText} onPress={() => window.open(buildOpenStreetMapViewUrl(spot.coordinate), '_blank')}>
          OpenStreetMap에서 크게 보기
        </Text>
      </View>
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
});
