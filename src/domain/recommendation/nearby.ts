import { getDistance } from 'geolib';

import type {
  NearbyRecommendation,
  NearbyRecommendationInput,
  NearbyRecommendationResult,
  TravelSpot,
  UserZaturiSpot,
} from '@/domain/recommendation/types';
import { getCandidateSpots } from '@/domain/recommendation/userSpots';

const walkMetersPerMinute = 68;
const carMetersPerMinute = 720;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function estimateOneWayMinutes(input: NearbyRecommendationInput, spot: TravelSpot, directDistanceMeters: number) {
  if (input.movementMode === 'walk') {
    const adjustedDistance = directDistanceMeters * 1.18;
    return Math.max(2, Math.ceil(adjustedDistance / walkMetersPerMinute));
  }

  const adjustedDistance = directDistanceMeters * 1.28;
  const parkingBuffer = spot.parking ? 4 : 8;

  return Math.max(4, Math.ceil(adjustedDistance / carMetersPerMinute) + parkingBuffer);
}

function stopBufferMinutes(input: NearbyRecommendationInput, spot: TravelSpot) {
  if (input.movementMode === 'walk') return 2;

  return spot.parking ? 4 : 8;
}

function distanceLimitMeters(input: NearbyRecommendationInput) {
  if (input.movementMode === 'walk') {
    return Math.min(4500, Math.max(900, input.spareMinutes * 55));
  }

  return Math.min(35_000, Math.max(6000, input.spareMinutes * 450));
}

function fitLabel(totalMinutes: number, spareMinutes: number) {
  if (totalMinutes <= spareMinutes * 0.75) return '여유 있음';
  if (totalMinutes <= spareMinutes) return '시간 안에 가능';

  return '조금 빠듯함';
}

function scoreRecommendation(
  spot: TravelSpot,
  input: NearbyRecommendationInput,
  totalMinutes: number,
  travelMinutes: number,
  distanceMeters: number,
) {
  const overflow = Math.max(0, totalMinutes - input.spareMinutes);
  const unused = Math.max(0, input.spareMinutes - totalMinutes);
  let score = 100;

  score -= overflow * 4;
  score -= unused * 0.22;
  score -= travelMinutes * (input.movementMode === 'walk' ? 1.1 : 0.65);
  score -= (distanceMeters / 1000) * (input.movementMode === 'walk' ? 2.2 : 0.7);
  score -= spot.walkingMinutes * (input.prefersLowWalking ? 1.2 : 0.3);

  if (spot.candidateMeta?.source === 'user') score += 18;
  if (spot.openNow) score += 8;
  if (spot.parking && input.movementMode === 'car') score += 8;
  if (input.needsBarrierFree && spot.barrierFree) score += 22;
  if (input.needsBarrierFree && !spot.barrierFree) score -= 38;
  if (input.companion === 'family' && spot.kidFriendly) score += 12;
  if (input.companion === 'senior' && spot.walkingMinutes <= 10) score += 12;
  if (input.weather !== 'any' && spot.weatherFit.includes(input.weather)) score += 14;
  if (input.weather === 'rain' && !spot.indoor && !spot.weatherFit.includes('rain')) score -= 22;

  return clampScore(score);
}

function buildReasons(
  spot: TravelSpot,
  input: NearbyRecommendationInput,
  totalMinutes: number,
  travelMinutes: number,
  returnMinutes: number,
  distanceMeters: number,
) {
  const distanceKm = Math.max(0.1, distanceMeters / 1000);
  const reasons = [
    `${input.spareMinutes}분 중 이동 ${travelMinutes}분, 체류 ${spot.stayMinutes}분으로 계산했습니다.`,
    `${input.baseName}에서 약 ${distanceKm.toFixed(1)}km 거리의 후보입니다.`,
  ];

  if (input.includeReturnToBase) {
    reasons.push(`원위치 복귀 시간 ${returnMinutes}분을 함께 잡았습니다.`);
  }
  if (spot.candidateMeta?.source === 'user') reasons.push('직접 저장한 자투리 스팟이라 우선 후보로 봅니다.');
  if (spot.parking && input.movementMode === 'car') reasons.push('차량 이동 시 주차 가능성을 우선 반영했습니다.');
  if (input.prefersLowWalking && spot.walkingMinutes <= 10) reasons.push('보행 부담이 낮은 편입니다.');
  if (input.weather === 'rain' && spot.indoor) reasons.push('비 예보에도 이용하기 좋은 실내형 후보입니다.');
  if (totalMinutes > input.spareMinutes) reasons.push('시간이 조금 빠듯하므로 현장 체류 시간을 줄여야 합니다.');

  return reasons.slice(0, 4);
}

function titleForSpot(spot: TravelSpot, input: NearbyRecommendationInput) {
  if (spot.candidateMeta?.source === 'user') return '내가 찍어둔 자투리 장소';
  if (input.movementMode === 'walk') return '걸어서 쓰는 남는 시간';
  if (spot.category === 'cafe' || spot.category === 'rest') return '잠깐 쉬어가는 시간';
  if (spot.category === 'view') return '짧게 보는 전망';

  return '근처에서 채우는 자투리 경험';
}

export function getNearbyRecommendationResult(
  input: NearbyRecommendationInput,
  userSpots: UserZaturiSpot[] = [],
): NearbyRecommendationResult {
  const candidates = getCandidateSpots(userSpots);
  const maxDistanceMeters = distanceLimitMeters(input);
  const recommendations: NearbyRecommendation[] = [];

  for (const spot of candidates) {
    const distanceMeters = getDistance(input.baseCoordinate, spot.coordinate);
    if (distanceMeters > maxDistanceMeters) continue;

    const travelMinutes = estimateOneWayMinutes(input, spot, distanceMeters);
    const returnMinutes = input.includeReturnToBase ? travelMinutes : 0;
    const totalMinutes = travelMinutes + spot.stayMinutes + returnMinutes + stopBufferMinutes(input, spot);

    if (totalMinutes > input.spareMinutes + 12) continue;

    recommendations.push({
      id: `nearby-${spot.id}`,
      title: titleForSpot(spot, input),
      subtitle: `${input.baseName} 기준 ${fitLabel(totalMinutes, input.spareMinutes)}`,
      spot,
      totalMinutes,
      travelMinutes,
      returnMinutes,
      stayMinutes: spot.stayMinutes,
      distanceMeters,
      score: scoreRecommendation(spot, input, totalMinutes, travelMinutes, distanceMeters),
      fitLabel: fitLabel(totalMinutes, input.spareMinutes),
      reasons: buildReasons(spot, input, totalMinutes, travelMinutes, returnMinutes, distanceMeters),
      movementMode: input.movementMode,
    });
  }

  return {
    providerLabel: '무료 거리 기반 시간 추정',
    isLive: false,
    baseName: input.baseName,
    spareMinutes: input.spareMinutes,
    recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 6),
  };
}
