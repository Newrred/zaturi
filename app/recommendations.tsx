import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { RecommendationCard } from '@/components/RecommendationCard';
import { Badge, Card, EmptyState, Screen, SecondaryButton, Section } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { destinationPresets } from '@/data/destinations';
import { getRecommendationResult } from '@/domain/recommendation/recommend';
import { useTripStore } from '@/store/useTripStore';

function formatKm(meters: number) {
  return (meters / 1000).toFixed(meters >= 100_000 ? 0 : 1);
}

export default function RecommendationsScreen() {
  const originName = useTripStore((state) => state.originName);
  const destinationId = useTripStore((state) => state.destinationId);
  const originCoordinate = useTripStore((state) => state.originCoordinate);
  const spareMinutes = useTripStore((state) => state.spareMinutes);
  const companion = useTripStore((state) => state.companion);
  const weather = useTripStore((state) => state.weather);
  const needsBarrierFree = useTripStore((state) => state.needsBarrierFree);
  const prefersLowWalking = useTripStore((state) => state.prefersLowWalking);
  const input = useMemo(() => {
    const destination = destinationPresets.find((item) => item.id === destinationId) ?? destinationPresets[0];

    return {
      originName,
      destinationId: destination.id,
      destinationName: destination.name,
      destinationCoordinate: destination.coordinate,
      originCoordinate,
      spareMinutes,
      companion,
      weather,
      needsBarrierFree,
      prefersLowWalking,
    };
  }, [companion, destinationId, needsBarrierFree, originCoordinate, originName, prefersLowWalking, spareMinutes, weather]);
  const query = useQuery({
    queryKey: ['recommendation-result', input],
    queryFn: () => getRecommendationResult(input),
  });
  const baselineRoute = query.data?.baselineRoute;

  return (
    <Screen>
      <View style={styles.header}>
        <Badge label={`${input.originName} → ${input.destinationName} · ${input.spareMinutes}분`} />
        <Text style={styles.title}>경유 시간을 비교한 추천 번들</Text>
        <Text style={styles.description}>기본 경로와 스팟 경유 경로를 함께 계산해 추가 운전 시간이 작은 후보부터 정렬합니다.</Text>
      </View>

      {baselineRoute ? (
        <Section title="기본 경로">
          <Card muted>
            <View style={styles.routeSummaryRow}>
              <View style={styles.routeSummaryColumn}>
                <Text style={styles.routeTitle}>{baselineRoute.originName} → {input.destinationName}</Text>
                <Text style={styles.routeMeta}>
                  약 {baselineRoute.durationMinutes}분 · {formatKm(baselineRoute.distanceMeters)}km · {baselineRoute.trafficLabel}
                </Text>
              </View>
              <Badge label={query.data?.isLive ? '카카오 API' : '카카오 Mock'} tone="blue" />
            </View>
          </Card>
        </Section>
      ) : null}

      {query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>기본 경로와 경유 후보를 계산하고 있어요.</Text>
        </View>
      ) : null}

      {query.data?.bundles.length === 0 ? (
        <EmptyState title="추천 가능한 후보가 적어요" description="남는 시간을 조금 늘리거나 접근성/보행 조건을 낮춰보세요." />
      ) : null}

      {query.data?.bundles.map((bundle) => (
        <RecommendationCard
          key={bundle.id}
          bundle={bundle}
          onPress={() => {
            router.push({ pathname: '/spot/[id]', params: { id: bundle.spots[0].id } });
          }}
        />
      ))}

      <SecondaryButton label="조건 다시 고르기" onPress={() => router.back()} />
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
});
