import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { defaultOrigin, destinationPresets } from '@/data/destinations';
import type {
  CompanionType,
  Coordinate,
  MovementMode,
  NearbyRecommendationInput,
  RecommendationInput,
  SavedSpotSnapshot,
  TravelSpot,
  UserZaturiSpot,
  WeatherPreference,
} from '@/domain/recommendation/types';

const storageKey = 'zaturi-trip-store';

type TripState = {
  originName: string;
  destinationName: string;
  destinationId: string;
  destinationCoordinate: Coordinate;
  spareMinutes: number;
  companion: CompanionType;
  weather: WeatherPreference;
  needsBarrierFree: boolean;
  prefersLowWalking: boolean;
  originCoordinate: Coordinate;
  nearbyBaseName: string;
  nearbyBaseCoordinate: Coordinate;
  nearbyMovementMode: MovementMode;
  nearbyIncludeReturn: boolean;
  userSpots: UserZaturiSpot[];
  savedSpotIds: string[];
  savedSpotSnapshots: SavedSpotSnapshot[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDestinationId: (destinationId: string) => void;
  setDestinationName: (destinationName: string) => void;
  setDestinationPlace: (destinationName: string, destinationCoordinate: Coordinate, destinationId?: string) => void;
  setOriginName: (originName: string) => void;
  setOriginPlace: (originName: string, originCoordinate: Coordinate) => void;
  setNearbyBasePlace: (nearbyBaseName: string, nearbyBaseCoordinate: Coordinate) => void;
  setNearbyMovementMode: (nearbyMovementMode: MovementMode) => void;
  setNearbyIncludeReturn: (nearbyIncludeReturn: boolean) => void;
  setSpareMinutes: (spareMinutes: number) => void;
  setCompanion: (companion: CompanionType) => void;
  setWeather: (weather: WeatherPreference) => void;
  setNeedsBarrierFree: (needsBarrierFree: boolean) => void;
  setPrefersLowWalking: (prefersLowWalking: boolean) => void;
  setOriginCoordinate: (originCoordinate: Coordinate) => void;
  addUserSpot: (spot: UserZaturiSpot) => void;
  removeUserSpot: (spotId: string) => void;
  toggleSavedSpot: (spotId: string, spot?: TravelSpot) => void;
  clearSavedSpots: () => void;
  buildRecommendationInput: () => RecommendationInput;
  buildNearbyRecommendationInput: () => NearbyRecommendationInput;
};

type PersistedTripState = Pick<
  TripState,
  | 'originName'
  | 'originCoordinate'
  | 'nearbyBaseName'
  | 'nearbyBaseCoordinate'
  | 'nearbyMovementMode'
  | 'nearbyIncludeReturn'
  | 'userSpots'
  | 'destinationName'
  | 'destinationId'
  | 'destinationCoordinate'
  | 'spareMinutes'
  | 'companion'
  | 'weather'
  | 'needsBarrierFree'
  | 'prefersLowWalking'
  | 'savedSpotIds'
  | 'savedSpotSnapshots'
>;

function toPersistedState(state: TripState): PersistedTripState {
  return {
    originName: state.originName,
    originCoordinate: state.originCoordinate,
    nearbyBaseName: state.nearbyBaseName,
    nearbyBaseCoordinate: state.nearbyBaseCoordinate,
    nearbyMovementMode: state.nearbyMovementMode,
    nearbyIncludeReturn: state.nearbyIncludeReturn,
    userSpots: state.userSpots,
    savedSpotSnapshots: state.savedSpotSnapshots,
    destinationName: state.destinationName,
    destinationId: state.destinationId,
    destinationCoordinate: state.destinationCoordinate,
    spareMinutes: state.spareMinutes,
    companion: state.companion,
    weather: state.weather,
    needsBarrierFree: state.needsBarrierFree,
    prefersLowWalking: state.prefersLowWalking,
    savedSpotIds: state.savedSpotIds,
  };
}

async function saveState(state: TripState) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(toPersistedState(state)));
}

export const useTripStore = create<TripState>((set, get) => {
  function commit(partial: Partial<TripState>) {
    set((state) => {
      const nextState = { ...state, ...partial };
      void saveState(nextState);
      return partial;
    });
  }

  return {
    originName: '',
    destinationName: '',
    destinationId: 'pending-destination',
    destinationCoordinate: destinationPresets[0].coordinate,
    spareMinutes: 60,
    companion: 'couple',
    weather: 'any',
    needsBarrierFree: false,
    prefersLowWalking: true,
    originCoordinate: defaultOrigin,
    nearbyBaseName: '',
    nearbyBaseCoordinate: defaultOrigin,
    nearbyMovementMode: 'walk',
    nearbyIncludeReturn: true,
    userSpots: [],
    savedSpotIds: [],
    savedSpotSnapshots: [],
    hydrated: false,
    hydrate: async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedTripState>;
      const destinationId = parsed.destinationId ?? destinationPresets[0].id;
      const destination = destinationPresets.find((item) => item.id === destinationId);
      const fallbackDestination = destination ?? destinationPresets[0];
      set({
        originName: parsed.originName ?? '',
        originCoordinate: parsed.originCoordinate ?? defaultOrigin,
        nearbyBaseName: parsed.nearbyBaseName ?? '',
        nearbyBaseCoordinate: parsed.nearbyBaseCoordinate ?? parsed.originCoordinate ?? defaultOrigin,
        nearbyMovementMode: parsed.nearbyMovementMode ?? 'walk',
        nearbyIncludeReturn: parsed.nearbyIncludeReturn ?? true,
        userSpots: parsed.userSpots ?? [],
        savedSpotSnapshots: parsed.savedSpotSnapshots ?? [],
        destinationName: parsed.destinationName ?? '',
        destinationId,
        destinationCoordinate: parsed.destinationCoordinate ?? fallbackDestination.coordinate,
        spareMinutes: parsed.spareMinutes ?? 60,
        companion: parsed.companion ?? 'couple',
        weather: parsed.weather ?? 'any',
        needsBarrierFree: parsed.needsBarrierFree ?? false,
        prefersLowWalking: parsed.prefersLowWalking ?? true,
        savedSpotIds: parsed.savedSpotIds ?? [],
        hydrated: true,
      });
    },
    setDestinationId: (destinationId) => {
      const destination = destinationPresets.find((item) => item.id === destinationId);
      commit({
        destinationId,
        destinationName: destination?.name ?? get().destinationName,
        destinationCoordinate: destination?.coordinate ?? get().destinationCoordinate,
      });
    },
    setDestinationName: (destinationName) => commit({ destinationName }),
    setDestinationPlace: (destinationName, destinationCoordinate, destinationId) =>
      commit({
        destinationName,
        destinationCoordinate,
        destinationId: destinationId ?? `search-${destinationName}`,
      }),
    setOriginName: (originName) => commit({ originName }),
    setOriginPlace: (originName, originCoordinate) => commit({ originName, originCoordinate }),
    setNearbyBasePlace: (nearbyBaseName, nearbyBaseCoordinate) => commit({ nearbyBaseName, nearbyBaseCoordinate }),
    setNearbyMovementMode: (nearbyMovementMode) => commit({ nearbyMovementMode }),
    setNearbyIncludeReturn: (nearbyIncludeReturn) => commit({ nearbyIncludeReturn }),
    setSpareMinutes: (spareMinutes) => commit({ spareMinutes }),
    setCompanion: (companion) => commit({ companion }),
    setWeather: (weather) => commit({ weather }),
    setNeedsBarrierFree: (needsBarrierFree) => commit({ needsBarrierFree }),
    setPrefersLowWalking: (prefersLowWalking) => commit({ prefersLowWalking }),
    setOriginCoordinate: (originCoordinate) => commit({ originCoordinate }),
    addUserSpot: (spot) => {
      const state = get();
      commit({
        userSpots: [spot, ...state.userSpots.filter((item) => item.id !== spot.id)],
        savedSpotIds: state.savedSpotIds.includes(spot.id) ? state.savedSpotIds : [spot.id, ...state.savedSpotIds],
      });
    },
    removeUserSpot: (spotId) => {
      const state = get();
      commit({
        userSpots: state.userSpots.filter((spot) => spot.id !== spotId),
        savedSpotIds: state.savedSpotIds.filter((id) => id !== spotId),
        savedSpotSnapshots: state.savedSpotSnapshots.filter((spot) => spot.id !== spotId),
      });
    },
    toggleSavedSpot: (spotId, spot) => {
      const state = get();
      const isSaved = state.savedSpotIds.includes(spotId);

      commit({
        savedSpotIds: isSaved ? state.savedSpotIds.filter((id) => id !== spotId) : [...state.savedSpotIds, spotId],
        savedSpotSnapshots: isSaved
          ? state.savedSpotSnapshots.filter((item) => item.id !== spotId)
          : spot
            ? [spot, ...state.savedSpotSnapshots.filter((item) => item.id !== spotId)]
            : state.savedSpotSnapshots,
      });
    },
    clearSavedSpots: () => commit({ savedSpotIds: [], savedSpotSnapshots: [] }),
    buildRecommendationInput: () => {
      const state = get();

      return {
        originName: state.originName,
        destinationId: state.destinationId,
        destinationName: state.destinationName,
        destinationCoordinate: state.destinationCoordinate,
        originCoordinate: state.originCoordinate,
        spareMinutes: state.spareMinutes,
        companion: state.companion,
        weather: state.weather,
        needsBarrierFree: state.needsBarrierFree,
        prefersLowWalking: state.prefersLowWalking,
      };
    },
    buildNearbyRecommendationInput: () => {
      const state = get();

      return {
        baseName: state.nearbyBaseName,
        baseCoordinate: state.nearbyBaseCoordinate,
        spareMinutes: state.spareMinutes,
        movementMode: state.nearbyMovementMode,
        companion: state.companion,
        weather: state.weather,
        needsBarrierFree: state.needsBarrierFree,
        prefersLowWalking: state.prefersLowWalking,
        includeReturnToBase: state.nearbyIncludeReturn,
      };
    },
  };
});
