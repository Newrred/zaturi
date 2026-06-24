import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import type { NearbyRecommendation } from '@/domain/recommendation/types';
import { normalizeRemoteMediaUrl } from '@/utils/mediaUrl';

function formatKm(meters: number) {
  return (meters / 1000).toFixed(meters >= 10_000 ? 0 : 1);
}

function movementLabel(recommendation: NearbyRecommendation) {
  return recommendation.movementMode === 'walk' ? '도보' : '차량';
}

export function TimeFitCard({ recommendation, onPress }: { recommendation: NearbyRecommendation; onPress: () => void }) {
  const { spot } = recommendation;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <View style={styles.image}>
          <Image source={{ uri: normalizeRemoteMediaUrl(spot.imageUrl) }} style={styles.imagePhoto} contentFit="cover" />
          <View style={styles.imageShade}>
            <Badge label={recommendation.fitLabel} tone={recommendation.fitLabel === '조금 빠듯함' ? 'amber' : 'green'} />
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleColumn}>
            <Text style={styles.title}>{recommendation.title}</Text>
            <Text style={styles.subtitle}>{spot.name}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.score}>{recommendation.score}</Text>
            <Text style={styles.scoreLabel}>적합도</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metric}>총 {recommendation.totalMinutes}분</Text>
          <Text style={styles.metric}>{movementLabel(recommendation)} {recommendation.travelMinutes}분</Text>
          <Text style={styles.metric}>체류 {recommendation.stayMinutes}분</Text>
          {recommendation.returnMinutes > 0 ? <Text style={styles.metric}>복귀 {recommendation.returnMinutes}분</Text> : null}
        </View>

        <View style={styles.timeBox}>
          <Text style={styles.timeText}>
            {formatKm(recommendation.distanceMeters)}km · {recommendation.subtitle}
          </Text>
          <Text style={styles.timeText}>
            {spot.parking ? '주차 가능성 있음' : '주차 확인 필요'} · 보행 {spot.walkingMinutes}분
          </Text>
        </View>

        <View style={styles.reasonList}>
          {recommendation.reasons.slice(0, 3).map((reason) => (
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
    height: 132,
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
    fontWeight: '900',
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
  timeBox: {
    gap: spacing.xs,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  timeText: {
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
