import type { DestinationPreset } from '@/domain/recommendation/types';

export type PlacePreset = {
  id: string;
  name: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
};

export const originPresets: PlacePreset[] = [
  {
    id: 'seoul-cityhall',
    name: '서울시청',
    description: '수도권 출발 기본값',
    coordinate: { latitude: 37.5665, longitude: 126.978 },
  },
  {
    id: 'jamsil',
    name: '잠실역',
    description: '서울 동남권 출발',
    coordinate: { latitude: 37.5133, longitude: 127.1001 },
  },
  {
    id: 'hanam',
    name: '하남검단산역',
    description: '서울양양고속도로 접근',
    coordinate: { latitude: 37.5396, longitude: 127.2238 },
  },
  {
    id: 'wonju',
    name: '원주',
    description: '영동고속도로 중간 출발',
    coordinate: { latitude: 37.3422, longitude: 127.9202 },
  },
];

export const destinationPresets: DestinationPreset[] = [
  {
    id: 'gangneung',
    name: '강릉',
    description: '동해안, 커피거리, 경포권',
    coordinate: { latitude: 37.7519, longitude: 128.8761 },
  },
  {
    id: 'sokcho',
    name: '속초',
    description: '설악산, 바다, 중앙시장',
    coordinate: { latitude: 38.207, longitude: 128.5919 },
  },
  {
    id: 'yangyang',
    name: '양양',
    description: '서울양양고속도로, 해변, 서핑',
    coordinate: { latitude: 38.0754, longitude: 128.619 },
  },
  {
    id: 'pyeongchang',
    name: '평창',
    description: '영동고속도로, 숲길, 고원 휴양',
    coordinate: { latitude: 37.3705, longitude: 128.3904 },
  },
];

export const defaultOrigin = originPresets[0].coordinate;
