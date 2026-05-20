import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card, EmptyState, Screen, SecondaryButton } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { mockSpots } from '@/data/mockSpots';
import { useTripStore } from '@/store/useTripStore';

export default function SavedScreen() {
  const savedSpotIds = useTripStore((state) => state.savedSpotIds);
  const clearSavedSpots = useTripStore((state) => state.clearSavedSpots);
  const savedSpots = mockSpots.filter((spot) => savedSpotIds.includes(spot.id));

  return (
    <Screen>
      <Text style={styles.title}>저장한 자투리 스팟</Text>
      {savedSpots.length === 0 ? (
        <EmptyState title="아직 저장한 장소가 없어요" description="추천 상세에서 마음에 드는 후보를 저장해두면 여기에 모입니다." />
      ) : null}
      {savedSpots.map((spot) => (
        <Card key={spot.id}>
          <Text style={styles.spotName}>{spot.name}</Text>
          <Text style={styles.spotText}>{spot.summary}</Text>
          <SecondaryButton label="상세 보기" onPress={() => router.push({ pathname: '/spot/[id]', params: { id: spot.id } })} />
        </Card>
      ))}
      {savedSpots.length > 0 ? <SecondaryButton label="저장 목록 비우기" onPress={clearSavedSpots} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
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
});
