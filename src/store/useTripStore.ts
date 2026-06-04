import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { defaultOrigin, destinationPresets } from '@/data/destinations';
import type { CompanionType, Coordinate, RecommendationInput, WeatherPreference } from '@/domain/recommendation/types';

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
  savedSpotIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDestinationId: (destinationId: string) => void;
  setDestinationName: (destinationName: string) => void;
  setDestinationPlace: (destinationName: string, destinationCoordinate: Coordinate, destinationId?: string) => void;
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
  | 'destinationCoordinate'
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
      const destination = destinationPresets.find((item) => item.id === destinationId);
      const fallbackDestination = destination ?? destinationPresets[0];
      set({
        originName: parsed.originName ?? '',
        originCoordinate: parsed.originCoordinate ?? defaultOrigin,
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
  };
});
