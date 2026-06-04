import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RouteMiniMap } from '@/components/RouteMiniMap';
import { Badge, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import type { RecommendationBundle } from '@/domain/recommendation/types';
import { normalizeRemoteMediaUrl } from '@/utils/mediaUrl';

function formatKm(meters: number) {
  return (meters / 1000).toFixed(meters >= 100_000 ? 0 : 1);
}

export function RecommendationCard({ bundle, onPress }: { bundle: RecommendationBundle; onPress: () => void }) {
  const spot = bundle.spots[0];
  const assessment = bundle.routePlan.assessment;
  const baselineRoute = bundle.routePlan.baselineRoute;
  const waypointRoute = bundle.routePlan.waypointRoute;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <View style={styles.image}>
          <Image source={{ uri: normalizeRemoteMediaUrl(spot.imageUrl) }} style={styles.imagePhoto} contentFit="cover" />
          <View style={styles.imageShade}>
            <Badge label={bundle.routeFitLabel} tone={bundle.detourMinutes <= 10 ? 'green' : 'amber'} />
          </View>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.titleColumn}>
            <Text style={styles.title}>{bundle.title}</Text>
            <Text style={styles.subtitle}>{bundle.subtitle}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.score}>{bundle.score}</Text>
            <Text style={styles.scoreLabel}>적합도</Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metric}>여유 사용 {bundle.totalMinutes}분</Text>
          <Text style={styles.metric}>추가 운전 {bundle.detourMinutes}분</Text>
          <Text style={styles.metric}>체류 {spot.stayMinutes}분</Text>
        </View>
        <View style={styles.routeCompare}>
          <Text style={styles.routeCompareText}>
            기본 {baselineRoute.durationMinutes}분 → 경유 {waypointRoute.durationMinutes}분
          </Text>
          <Text style={styles.routeCompareText}>
            경로선 {formatKm(assessment.routeCorridorDistanceMeters)}km · {bundle.routePlan.isLive ? '실시간 API' : 'Mock 계산'}
          </Text>
        </View>
        <RouteMiniMap
          baselineRoute={baselineRoute}
          waypointRoute={waypointRoute}
          spot={spot}
          detourMinutes={assessment.addedDriveMinutes}
        />
        <View style={styles.reasonList}>
          {bundle.reasons.slice(0, 3).map((reason) => (
            <Text key={reason} style={styles.reason}>
              {reason}
            </Text>
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.82,
  },
  image: {
    height: 138,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  imagePhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  imageShade: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  titleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  titleColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  scoreBox: {
    minWidth: 58,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.blueSoft,
    padding: spacing.sm,
  },
  score: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '900',
  },
  scoreLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    color: colors.primaryDark,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: '800',
  },
  routeCompare: {
    gap: spacing.xs,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  routeCompareText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  reasonList: {
    gap: spacing.xs,
  },
  reason: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
});
