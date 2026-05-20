import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { TravelSpot } from '@/domain/recommendation/types';

export function SpotMap({ spot }: { spot: TravelSpot }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.title}>지도 미리보기</Text>
      <Text style={styles.text}>{spot.name}</Text>
      <Text style={styles.coord}>
        {spot.coordinate.latitude.toFixed(4)}, {spot.coordinate.longitude.toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 220,
    justifyContent: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: spacing.lg,
  },
  title: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '800',
  },
  text: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  coord: {
    marginTop: spacing.xs,
    color: colors.inkMuted,
    fontSize: 13,
  },
});
