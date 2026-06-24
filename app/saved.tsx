import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, EmptyState, Screen, SecondaryButton } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { getSavedTravelSpots } from '@/domain/recommendation/userSpots';
import { useTripStore } from '@/store/useTripStore';

export default function SavedScreen() {
  const savedSpotIds = useTripStore((state) => state.savedSpotIds);
  const savedSpotSnapshots = useTripStore((state) => state.savedSpotSnapshots);
  const userSpots = useTripStore((state) => state.userSpots);
  const clearSavedSpots = useTripStore((state) => state.clearSavedSpots);
  const removeUserSpot = useTripStore((state) => state.removeUserSpot);
  const visibleSpots = getSavedTravelSpots(savedSpotIds, userSpots, savedSpotSnapshots);
  const hasAnySpot = visibleSpots.length > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>저장한 자투리 스팟</Text>
        <Text style={styles.description}>추천에서 저장했거나 직접 추가한 장소를 다시 확인합니다.</Text>
      </View>

      <View style={styles.quickLinks}>
        <SecondaryButton label="내 스팟 추가" onPress={() => router.push('/spot/new')} />
        {visibleSpots.length > 0 ? <SecondaryButton label="저장 목록 비우기" onPress={clearSavedSpots} /> : null}
      </View>

      {!hasAnySpot ? (
        <EmptyState title="아직 저장한 장소가 없어요" description="추천 상세에서 저장하거나 직접 자투리 스팟을 추가해보세요." />
      ) : null}

      {visibleSpots.map((spot) => (
        <Card key={spot.id}>
          <View style={styles.titleRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.spotName}>{spot.name}</Text>
              <Text style={styles.spotText}>{spot.summary}</Text>
            </View>
            {spot.candidateMeta?.source === 'user' ? <Badge label="직접 추가" tone="blue" /> : null}
          </View>
          <View style={styles.buttonRow}>
            <SecondaryButton label="상세 보기" onPress={() => router.push({ pathname: '/spot/[id]', params: { id: spot.id, context: 'saved' } })} />
            {spot.candidateMeta?.source === 'user' ? <SecondaryButton label="삭제" onPress={() => removeUserSpot(spot.id)} /> : null}
          </View>
        </Card>
      ))}
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
  },
  description: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  titleColumn: {
    minWidth: 190,
    flex: 1,
    gap: spacing.xs,
  },
  spotName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  spotText: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
