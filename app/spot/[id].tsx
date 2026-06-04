import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { SpotMap } from '@/components/SpotMap';
import { Badge, Card, EmptyState, PrimaryButton, Screen, SecondaryButton, Section } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { getSpotById } from '@/domain/recommendation/recommend';
import { useTripStore } from '@/store/useTripStore';
import { normalizeRemoteMediaUrl } from '@/utils/mediaUrl';
import { openWaypointNavigation } from '@/utils/navigation';

export default function SpotDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const spot = params.id ? getSpotById(params.id) : undefined;
  const savedSpotIds = useTripStore((state) => state.savedSpotIds);
  const toggleSavedSpot = useTripStore((state) => state.toggleSavedSpot);
  const originCoordinate = useTripStore((state) => state.originCoordinate);
  const destinationName = useTripStore((state) => state.destinationName);
  const destinationCoordinate = useTripStore((state) => state.destinationCoordinate);

  if (!spot) {
    return (
      <Screen>
        <EmptyState title="스팟을 찾을 수 없어요" description="추천 목록으로 돌아가 다시 선택해주세요." />
        <SecondaryButton label="추천으로 돌아가기" onPress={() => router.replace('/recommendations')} />
      </Screen>
    );
  }

  const isSaved = savedSpotIds.includes(spot.id);

  return (
    <Screen
      footer={
        <View style={styles.footerButtons}>
          <SecondaryButton label={isSaved ? '저장 해제' : '저장'} onPress={() => toggleSavedSpot(spot.id)} />
          <PrimaryButton
            label="경유 경로 열기"
            onPress={() =>
              void openWaypointNavigation({
                originCoordinate,
                destinationCoordinate,
                waypoint: spot,
              })
            }
          />
        </View>
      }
    >
      <View style={styles.heroImage}>
        <Image source={{ uri: normalizeRemoteMediaUrl(spot.imageUrl) }} style={styles.heroPhoto} contentFit="cover" />
        <View style={styles.heroShade}>
          <Badge label={spot.sourceLabel} tone="blue" />
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{spot.name}</Text>
        <Text style={styles.address}>{spot.address}</Text>
      </View>

      <Card>
        <Text style={styles.summary}>{spot.summary}</Text>
        <View style={styles.metricGrid}>
          <Metric label="체류" value={`${spot.stayMinutes}분`} />
          <Metric label="보행" value={`${spot.walkingMinutes}분`} />
          <Metric label="주차" value={spot.parking ? '가능' : '확인 필요'} />
          <Metric label="접근성" value={spot.barrierFree ? '우선' : '일반'} />
        </View>
      </Card>

      <Section title="추천 근거">
        <Card muted>
          <View style={styles.tagRow}>
            {spot.officialTags.map((tag) => (
              <Badge key={tag} label={tag} tone="amber" />
            ))}
          </View>
          <Text style={styles.reasonText}>
            이 후보는 TourAPI 형태의 시드 데이터로 구성되어 있으며, 운영 여부, 주차, 접근성, 보행 부담, 날씨 조건을 MVP 추천 점수에 반영합니다.
          </Text>
        </Card>
      </Section>

      <Section title="경유 흐름">
        <Card>
          <Text style={styles.reasonText}>
            현재 선택한 출발지에서 이 스팟을 들른 뒤 {destinationName || '목적지'}까지 이어지는 경유 경로로 열 수 있습니다.
          </Text>
        </Card>
      </Section>

      <Section title="위치">
        <SpotMap spot={spot} />
      </Section>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    height: 210,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  heroPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  heroShade: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 34,
  },
  address: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  summary: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    minWidth: '46%',
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    marginTop: spacing.xs,
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '900',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reasonText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
