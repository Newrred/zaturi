import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { defaultOrigin, destinationPresets, originPresets } from '@/data/destinations';
import type { CompanionType, Coordinate, RecommendationInput, WeatherPreference } from '@/domain/recommendation/types';

const storageKey = 'zaturi-trip-store';

type TripState = {
  originName: string;
  destinationName: string;
  destinationId: string;
  spareMinutes: number;
  companion: CompanionType;
  weather: WeatherPreference;
  needsBarrierFree: boolean;
  prefersLowWalking: boolean;
  originCoordinate: Coordinate;
  savedSpotIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDestinationId: (destinationId: string) => void;
  setDestinationName: (destinationName: string) => void;
  setOriginName: (originName: string) => void;
  setOriginPlace: (originName: string, originCoordinate: Coordinate) => void;
  setSpareMinutes: (spareMinutes: number) => void;
  setCompanion: (companion: CompanionType) => void;
  setWeather: (weather: WeatherPreference) => void;
  setNeedsBarrierFree: (needsBarrierFree: boolean) => void;
  setPrefersLowWalking: (prefersLowWalking: boolean) => void;
  setOriginCoordinate: (originCoordinate: Coordinate) => void;
  toggleSavedSpot: (spotId: string) => void;
  clearSavedSpots: () => void;
  buildRecommendationInput: () => RecommendationInput;
};

type PersistedTripState = Pick<
  TripState,
  | 'originName'
  | 'originCoordinate'
  | 'destinationName'
  | 'destinationId'
  | 'spareMinutes'
  | 'companion'
  | 'weather'
  | 'needsBarrierFree'
  | 'prefersLowWalking'
  | 'savedSpotIds'
>;

function toPersistedState(state: TripState): PersistedTripState {
  return {
    originName: state.originName,
    originCoordinate: state.originCoordinate,
    destinationName: state.destinationName,
    destinationId: state.destinationId,
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
    originName: originPresets[0].name,
    destinationName: destinationPresets[0].name,
    destinationId: destinationPresets[0].id,
    spareMinutes: 60,
    companion: 'couple',
    weather: 'any',
    needsBarrierFree: false,
    prefersLowWalking: true,
    originCoordinate: defaultOrigin,
    savedSpotIds: [],
    hydrated: false,
    hydrate: async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedTripState>;
      const destinationId = parsed.destinationId ?? destinationPresets[0].id;
      const destination = destinationPresets.find((item) => item.id === destinationId) ?? destinationPresets[0];
      set({
        originName: parsed.originName ?? originPresets[0].name,
        originCoordinate: parsed.originCoordinate ?? defaultOrigin,
        destinationName: destination.name,
        destinationId: destination.id,
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
      commit({ destinationId, destinationName: destination?.name ?? get().destinationName });
    },
    setDestinationName: (destinationName) => commit({ destinationName }),
    setOriginName: (originName) => commit({ originName }),
    setOriginPlace: (originName, originCoordinate) => commit({ originName, originCoordinate }),
    setSpareMinutes: (spareMinutes) => commit({ spareMinutes }),
    setCompanion: (companion) => commit({ companion }),
    setWeather: (weather) => commit({ weather }),
    setNeedsBarrierFree: (needsBarrierFree) => commit({ needsBarrierFree }),
    setPrefersLowWalking: (prefersLowWalking) => commit({ prefersLowWalking }),
    setOriginCoordinate: (originCoordinate) => commit({ originCoordinate }),
    toggleSavedSpot: (spotId) => {
      const state = get();
      commit({
        savedSpotIds: state.savedSpotIds.includes(spotId)
          ? state.savedSpotIds.filter((id) => id !== spotId)
          : [...state.savedSpotIds, spotId],
      });
    },
    clearSavedSpots: () => commit({ savedSpotIds: [] }),
    buildRecommendationInput: () => {
      const state = get();
      const destination = destinationPresets.find((item) => item.id === state.destinationId) ?? destinationPresets[0];

      return {
        originName: state.originName,
        destinationId: destination.id,
        destinationName: destination.name,
        destinationCoordinate: destination.coordinate,
        originCoordinate: state.originCoordinate,
        spareMinutes: state.spareMinutes,
        companion: state.companion,
        weather: state.weather,
        needsBarrierFree: state.needsBarrierFree,
        prefersLowWalking: state.prefersLowWalking,
      };
    },
  };
});
