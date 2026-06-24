import { mockSpots } from '@/data/mockSpots';
import type { TravelSpot, UserZaturiSpot } from '@/domain/recommendation/types';

const userSpotImageUrl =
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';

export function userSpotToTravelSpot(spot: UserZaturiSpot): TravelSpot {
  return {
    id: spot.id,
    name: spot.name,
    category: 'walk',
    address: spot.address,
    area: spot.area,
    coordinate: spot.coordinate,
    imageUrl: userSpotImageUrl,
    summary: spot.summary,
    sourceLabel: '내가 추가한 자투리 스팟',
    officialTags: spot.tags.length > 0 ? spot.tags : ['직접 추가'],
    stayMinutes: spot.stayMinutes,
    walkingMinutes: spot.walkingMinutes,
    parking: spot.parking,
    barrierFree: spot.barrierFree,
    kidFriendly: spot.kidFriendly,
    indoor: spot.indoor,
    weatherFit: spot.weatherFit,
    openNow: true,
    navKeyword: spot.name,
    candidateMeta: {
      source: 'user',
      priority: 95,
      reasons: ['사용자가 직접 저장한 자투리 후보입니다.'],
    },
  };
}

export function getCandidateSpots(userSpots: UserZaturiSpot[] = []) {
  return [...userSpots.map(userSpotToTravelSpot), ...mockSpots];
}

export function getSavedTravelSpots(savedSpotIds: string[], userSpots: UserZaturiSpot[] = [], savedSpotSnapshots: TravelSpot[] = []) {
  const spotsById = new Map<string, TravelSpot>();

  for (const spot of savedSpotSnapshots) {
    spotsById.set(spot.id, spot);
  }

  for (const spot of getCandidateSpots(userSpots)) {
    spotsById.set(spot.id, spot);
  }

  const savedSpots: TravelSpot[] = [];

  for (const spotId of savedSpotIds) {
    const spot = spotsById.get(spotId);
    if (spot) savedSpots.push(spot);
  }

  return savedSpots;
}

export function createUserSpotId() {
  return `user-${Date.now()}`;
}
