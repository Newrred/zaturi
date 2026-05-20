import { mockSpots } from '@/data/mockSpots';
import { buildWaypointRouteSummary, getKakaoCandidateRoutePlan } from '@/domain/routing/kakaoRoutePlanner';
import type { SpotRouteAssessment } from '@/domain/routing/types';
import type { RecommendationBundle, RecommendationInput, RecommendationResult, TravelSpot } from './types';

let latestCandidateSpots: TravelSpot[] = mockSpots;

function stopBufferMinutes(spot: TravelSpot) {
  return spot.parking ? 6 : 10;
}

function scoreSpot(spot: TravelSpot, input: RecommendationInput, assessment: SpotRouteAssessment) {
  const detour = assessment.addedDriveMinutes;
  const totalMinutes = spot.stayMinutes + detour + stopBufferMinutes(spot);
  const corridorKm = assessment.routeCorridorDistanceMeters / 1000;
  let score = 100;

  score -= Math.max(0, totalMinutes - input.spareMinutes) * 2.8;
  score -= detour * 1.5;
  score -= corridorKm * 0.7;
  score -= spot.walkingMinutes * (input.prefersLowWalking ? 1.2 : 0.35);

  if (spot.area === input.destinationName) score += 18;
  if (assessment.confidence === 'high') score += 14;
  if (assessment.confidence === 'medium') score += 6;
  if (assessment.confidence === 'low') score -= 12;
  if (spot.openNow) score += 12;
  if (spot.parking) score += 8;
  if (input.needsBarrierFree && spot.barrierFree) score += 24;
  if (input.needsBarrierFree && !spot.barrierFree) score -= 40;
  if (input.companion === 'family' && spot.kidFriendly) score += 14;
  if (input.companion === 'senior' && spot.walkingMinutes <= 10) score += 14;
  if (input.weather !== 'any' && spot.weatherFit.includes(input.weather)) score += 18;
  if (input.weather === 'rain' && !spot.indoor && !spot.weatherFit.includes('rain')) score -= 24;

  return { score, detour, totalMinutes };
}

function buildReasons(spot: TravelSpot, input: RecommendationInput, assessment: SpotRouteAssessment) {
  const corridorKm = Math.max(0.1, assessment.routeCorridorDistanceMeters / 1000);
  const reasons = [
    `기본 경로에 더하면 추가 운전은 약 ${assessment.addedDriveMinutes}분입니다.`,
    `경로선에서 약 ${corridorKm.toFixed(1)}km 안쪽 후보입니다.`,
    `${input.spareMinutes}분 여유 안에서 ${spot.stayMinutes}분 체류와 정차 버퍼를 함께 봅니다.`,
  ];

  if (spot.parking) reasons.push('주차 가능성을 우선 반영했습니다.');
  if (input.needsBarrierFree && spot.barrierFree) reasons.push('접근성 조건에 맞는 후보입니다.');
  if (input.prefersLowWalking && spot.walkingMinutes <= 10) reasons.push('보행 부담이 낮습니다.');
  if (input.weather === 'rain' && spot.indoor) reasons.push('비 예보에도 이용하기 좋은 실내형 후보입니다.');
  if (spot.candidateMeta?.reasons?.[0]) reasons.push(spot.candidateMeta.reasons[0]);
  if (spot.officialTags.length > 0) reasons.push(`${spot.officialTags.slice(0, 2).join(', ')} 맥락이 뚜렷합니다.`);

  return reasons.slice(0, 4);
}

function bundleTitle(spot: TravelSpot) {
  switch (spot.category) {
    case 'view':
      return '전망 한 번 더하기';
    case 'walk':
      return '짧은 산책 묶음';
    case 'rest':
      return '운전자 휴식 우선';
    case 'cafe':
      return '카페와 바다 정차';
    case 'barrierFree':
      return '저보행·실내 대안';
    case 'officialCourse':
      return '공식 코스 근처 경유';
    default:
      return '자투리 스팟 추천';
  }
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getRecommendationBundles(input: RecommendationInput): Promise<RecommendationBundle[]> {
  const result = await getRecommendationResult(input);

  return result.bundles;
}

export async function getRecommendationResult(input: RecommendationInput): Promise<RecommendationResult> {
  const candidateRoutePlan = await getKakaoCandidateRoutePlan(input, mockSpots);
  const candidateSpots = candidateRoutePlan.spots && candidateRoutePlan.spots.length > 0 ? candidateRoutePlan.spots : mockSpots;
  latestCandidateSpots = candidateSpots;
  const assessmentsBySpot = new Map(candidateRoutePlan.assessments.map((assessment) => [assessment.spotId, assessment]));

  const bundles: RecommendationBundle[] = [];

  for (const spot of candidateSpots) {
    const assessment = assessmentsBySpot.get(spot.id);

    if (!assessment) continue;

    const { score, detour, totalMinutes } = scoreSpot(spot, input, assessment);
    const waypointRoute = buildWaypointRouteSummary(input, spot, assessment);

    if (totalMinutes <= input.spareMinutes && assessment.routeCorridorDistanceMeters <= 70_000) {
      bundles.push({
        id: `bundle-${spot.id}`,
        title: bundleTitle(spot),
        subtitle: `${input.originName} → ${spot.name} → ${input.destinationName}`,
        spots: [spot],
        totalMinutes,
        detourMinutes: detour,
        score: clampScore(score),
        routeFitLabel:
          assessment.confidence === 'high' ? '경로 주변' : assessment.confidence === 'medium' ? '가벼운 이탈' : '목적지권 경유',
        reasons: buildReasons(spot, input, assessment),
        routePlan: {
          providerLabel: candidateRoutePlan.providerLabel,
          isLive: candidateRoutePlan.isLive,
          baselineRoute: candidateRoutePlan.baselineRoute,
          waypointRoute,
          assessment,
        },
      });
    }
  }

  return {
    providerLabel: candidateRoutePlan.providerLabel,
    isLive: candidateRoutePlan.isLive,
    baselineRoute: candidateRoutePlan.baselineRoute,
    bundles: bundles.sort((a, b) => b.score - a.score).slice(0, 5),
  };
}

export function getSpotById(id: string) {
  return latestCandidateSpots.find((spot) => spot.id === id) ?? mockSpots.find((spot) => spot.id === id);
}
