import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TimeFitCard } from '@/components/TimeFitCard';
import { Badge, Card, EmptyState, Screen, SecondaryButton, Section } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { getNearbyRecommendationResult } from '@/domain/recommendation/nearby';
import { useTripStore } from '@/store/useTripStore';

export default function NearbyScreen() {
  const nearbyBaseName = useTripStore((state) => state.nearbyBaseName);
  const nearbyBaseCoordinate = useTripStore((state) => state.nearbyBaseCoordinate);
  const nearbyMovementMode = useTripStore((state) => state.nearbyMovementMode);
  const nearbyIncludeReturn = useTripStore((state) => state.nearbyIncludeReturn);
  const spareMinutes = useTripStore((state) => state.spareMinutes);
  const companion = useTripStore((state) => state.companion);
  const weather = useTripStore((state) => state.weather);
  const needsBarrierFree = useTripStore((state) => state.needsBarrierFree);
  const prefersLowWalking = useTripStore((state) => state.prefersLowWalking);
  const userSpots = useTripStore((state) => state.userSpots);
  const input = useMemo(() => {
    return {
      baseName: nearbyBaseName,
      baseCoordinate: nearbyBaseCoordinate,
      spareMinutes,
      movementMode: nearbyMovementMode,
      companion,
      weather,
      needsBarrierFree,
      prefersLowWalking,
      includeReturnToBase: nearbyIncludeReturn,
    };
  }, [
    companion,
    nearbyBaseCoordinate,
    nearbyBaseName,
    nearbyIncludeReturn,
    nearbyMovementMode,
    needsBarrierFree,
    prefersLowWalking,
    spareMinutes,
    weather,
  ]);
  const { data, isLoading } = useQuery({
    enabled: input.baseName.trim().length > 0,
    queryKey: ['nearby-recommendation-result', input, userSpots],
    queryFn: () => getNearbyRecommendationResult(input, userSpots),
  });

  if (!input.baseName.trim()) {
    return (
      <Screen>
        <EmptyState title="기준 위치가 필요해요" description="홈에서 현재 위치를 선택하거나 장소를 검색한 뒤 다시 시도해주세요." />
        <SecondaryButton label="홈으로 돌아가기" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Badge label={`${input.baseName} · ${input.spareMinutes}분 · ${input.movementMode === 'walk' ? '도보' : '차량'}`} />
        <Text style={styles.title}>지금 남는 시간으로 가능한 경험</Text>
        <Text style={styles.description}>
          기준 위치에서 이동, 체류, 복귀 시간을 함께 잡아 실제로 넣을 수 있는 자투리 후보를 정렬합니다.
        </Text>
      </View>

      <Section title="계산 기준">
        <Card muted>
          <View style={styles.routeSummaryRow}>
            <View style={styles.routeSummaryColumn}>
              <Text style={styles.routeTitle}>{input.baseName} 기준</Text>
              <Text style={styles.routeMeta}>
                {data?.providerLabel ?? '무료 거리 기반 시간 추정'} · {input.includeReturnToBase ? '복귀 시간 포함' : '편도 기준'}
              </Text>
            </View>
            <Badge label={data?.isLive ? '실시간 API' : '무료 추정'} tone="blue" />
          </View>
        </Card>
      </Section>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>남는 시간 안에 들어오는 후보를 계산하고 있어요.</Text>
        </View>
      ) : null}

      {data?.recommendations.length === 0 ? (
        <EmptyState title="시간 안에 들어오는 후보가 적어요" description="남는 시간을 늘리거나 이동수단을 차량으로 바꿔보세요." />
      ) : null}

      {data?.recommendations.map((recommendation) => (
        <TimeFitCard
          key={recommendation.id}
          recommendation={recommendation}
          onPress={() => {
            router.push({ pathname: '/spot/[id]', params: { id: recommendation.spot.id, context: 'nearby' } });
          }}
        />
      ))}

      <View style={styles.quickLinks}>
        <SecondaryButton label="조건 다시 고르기" onPress={() => router.back()} />
        <SecondaryButton label="내 스팟 추가" onPress={() => router.push('/spot/new')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  routeSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  routeSummaryColumn: {
    minWidth: 210,
    flex: 1,
    gap: spacing.xs,
  },
  routeTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  routeMeta: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
