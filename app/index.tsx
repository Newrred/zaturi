import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlannerMap } from '@/components/planner/PlannerMap';
import { Chip, PrimaryButton, SecondaryButton } from '@/components/ui';
import { colors, opacity, radius, shadow, spacing } from '@/constants/theme';
import type { CompanionType, MovementMode, WeatherPreference } from '@/domain/recommendation/types';
import type { PlaceSearchResult, PlaceSearchRole } from '@/services/routeProxy/client';
import { searchRouteProxyPlaces } from '@/services/routeProxy/client';
import { useTripStore } from '@/store/useTripStore';

const timeOptions = [15, 30, 45, 60, 90, 120];
const companions: Array<{ id: CompanionType; label: string }> = [
  { id: 'solo', label: '혼자' },
  { id: 'couple', label: '커플' },
  { id: 'family', label: '가족' },
  { id: 'senior', label: '고령자 동반' },
];
const weatherOptions: Array<{ id: WeatherPreference; label: string }> = [
  { id: 'any', label: '상관없음' },
  { id: 'sunny', label: '맑은 날' },
  { id: 'rain', label: '비 예보' },
];
const movementModes: Array<{ id: MovementMode; label: string }> = [
  { id: 'walk', label: '도보' },
  { id: 'car', label: '차량' },
];

type HomeMode = 'moving' | 'nearby';
type PlannerStep = 'place' | 'time' | 'conditions';

type SearchState = {
  originQuery: string;
  destinationQuery: string;
  nearbyQuery: string;
  originResults: PlaceSearchResult[];
  destinationResults: PlaceSearchResult[];
  nearbyResults: PlaceSearchResult[];
  searchingRole: PlaceSearchRole | null;
  message: string | null;
};

type SearchAction =
  | { type: 'query'; role: PlaceSearchRole; value: string }
  | { type: 'start'; role: PlaceSearchRole }
  | { type: 'results'; role: PlaceSearchRole; results: PlaceSearchResult[]; message?: string | null }
  | { type: 'message'; message: string | null }
  | { type: 'select'; role: PlaceSearchRole; place: PlaceSearchResult }
  | { type: 'currentLocation'; role: 'origin' | 'nearby' }
  | { type: 'syncFromStore'; originName: string; destinationName: string; nearbyBaseName: string };

function queryKeyForRole(role: PlaceSearchRole) {
  if (role === 'origin') return 'originQuery';
  if (role === 'destination') return 'destinationQuery';
  return 'nearbyQuery';
}

function resultsKeyForRole(role: PlaceSearchRole) {
  if (role === 'origin') return 'originResults';
  if (role === 'destination') return 'destinationResults';
  return 'nearbyResults';
}

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'query':
      return { ...state, [queryKeyForRole(action.role)]: action.value };
    case 'start':
      return { ...state, searchingRole: action.role, message: null };
    case 'results':
      return {
        ...state,
        [resultsKeyForRole(action.role)]: action.results,
        searchingRole: null,
        message: action.message ?? null,
      };
    case 'message':
      return { ...state, searchingRole: null, message: action.message };
    case 'select':
      return {
        ...state,
        [queryKeyForRole(action.role)]: action.place.name,
        [resultsKeyForRole(action.role)]: [],
        message: null,
      };
    case 'currentLocation':
      return {
        ...state,
        [queryKeyForRole(action.role)]: '현재 위치',
        [resultsKeyForRole(action.role)]: [],
        message: null,
      };
    case 'syncFromStore':
      return {
        ...state,
        originQuery: action.originName,
        destinationQuery: action.destinationName,
        nearbyQuery: action.nearbyBaseName,
      };
    default:
      return state;
  }
}

function matchesConfirmedPlace(query: string, selectedName: string) {
  return selectedName.trim().length > 0 && query.trim() === selectedName.trim();
}

export default function HomeScreen() {
  const store = useTripStore();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [mode, setMode] = useState<HomeMode>('moving');
  const [step, setStep] = useState<PlannerStep>('place');
  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    originQuery: store.originName,
    destinationQuery: store.destinationName,
    nearbyQuery: store.nearbyBaseName,
    originResults: [],
    destinationResults: [],
    nearbyResults: [],
    searchingRole: null,
    message: null,
  });
  const snapPoints = useMemo(() => ['28%', '58%', '88%'], []);
  const originConfirmed = matchesConfirmedPlace(searchState.originQuery, store.originName);
  const destinationConfirmed = matchesConfirmedPlace(searchState.destinationQuery, store.destinationName);
  const nearbyConfirmed = matchesConfirmedPlace(searchState.nearbyQuery, store.nearbyBaseName);
  const canContinueFromPlace = mode === 'moving' ? originConfirmed && destinationConfirmed : nearbyConfirmed;
  const canStart = canContinueFromPlace && store.spareMinutes > 0;

  useEffect(() => {
    if (!store.hydrated) return;

    dispatchSearch({
      type: 'syncFromStore',
      originName: store.originName,
      destinationName: store.destinationName,
      nearbyBaseName: store.nearbyBaseName,
    });
  }, [store.destinationName, store.hydrated, store.nearbyBaseName, store.originName]);

  async function runPlaceSearch(role: PlaceSearchRole) {
    const query = String(searchState[queryKeyForRole(role)]).trim();

    if (query.length < 2) {
      dispatchSearch({ type: 'message', message: '두 글자 이상 입력하면 검색할 수 있어요.' });
      return;
    }

    dispatchSearch({ type: 'start', role });

    try {
      const response = await searchRouteProxyPlaces(query, role);

      if (!response) {
        dispatchSearch({
          type: 'message',
          message: '장소 검색 서버 URL이 설정되지 않았어요. .env의 EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL을 확인해주세요.',
        });
        return;
      }

      const results = response.results ?? [];
      const message = results.length === 0 ? '검색 결과가 없어요. 관광지 이름이나 주소를 조금 더 구체적으로 입력해보세요.' : null;
      dispatchSearch({ type: 'results', role, results, message });
    } catch {
      dispatchSearch({ type: 'message', message: '장소 검색 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.' });
    }
  }

  function selectPlace(role: PlaceSearchRole, place: PlaceSearchResult) {
    if (role === 'origin') {
      store.setOriginPlace(place.name, place.coordinate);
      dispatchSearch({ type: 'select', role, place });
      return;
    }

    if (role === 'destination') {
      store.setDestinationPlace(place.name, place.coordinate, place.id);
      dispatchSearch({ type: 'select', role, place });
      return;
    }

    store.setNearbyBasePlace(place.name, place.coordinate);
    dispatchSearch({ type: 'select', role, place });
  }

  async function applyCurrentLocation(role: 'origin' | 'nearby') {
    if (Platform.OS === 'web') {
      Alert.alert('현재 위치를 쓸 수 없어요', '웹에서는 장소 검색으로 기준 위치를 선택해주세요.');
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('위치 권한이 필요해요', '검색 결과에서 위치를 선택해주세요.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const coordinate = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      if (role === 'origin') {
        store.setOriginPlace('현재 위치', coordinate);
      } else {
        store.setNearbyBasePlace('현재 위치', coordinate);
      }
      dispatchSearch({ type: 'currentLocation', role });
    } catch {
      Alert.alert('현재 위치를 확인하지 못했어요', '장소 검색으로 기준 위치를 선택해주세요.');
    }
  }

  function openPlanner(nextStep: PlannerStep = 'place') {
    setStep(nextStep);
    sheetRef.current?.snapToIndex(1);
  }

  function closePlanner() {
    sheetRef.current?.close();
  }

  function changeMode(nextMode: HomeMode) {
    setMode(nextMode);
    setStep('place');
    sheetRef.current?.snapToIndex(1);
  }

  async function handleCurrentNearbyBase() {
    setMode('nearby');
    setStep('place');
    sheetRef.current?.snapToIndex(1);
    await applyCurrentLocation('nearby');
  }

  function nextFromPlace() {
    if (!canContinueFromPlace) {
      Alert.alert(
        mode === 'moving' ? '출발지와 목적지를 확정해주세요' : '기준 위치를 확정해주세요',
        '검색 결과에서 장소를 선택해야 좌표 기준으로 추천할 수 있어요.',
      );
      return;
    }
    setStep('time');
    sheetRef.current?.snapToIndex(1);
  }

  function startJourney() {
    if (!canStart) {
      nextFromPlace();
      return;
    }

    router.push(mode === 'moving' ? '/recommendations' : '/nearby');
  }

  return (
    <View style={styles.root}>
      <PlannerMap
        accessibilityLabel="자투리여행 탐색 지도"
        baseCoordinate={mode === 'nearby' && nearbyConfirmed ? store.nearbyBaseCoordinate : null}
        destinationCoordinate={mode === 'moving' && destinationConfirmed ? store.destinationCoordinate : null}
        interactive
        originCoordinate={mode === 'moving' && originConfirmed ? store.originCoordinate : null}
        testID="planner-map"
      />

      <View pointerEvents="none" style={styles.centerPinHalo}>
        <View style={styles.centerPin} />
      </View>

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, spacing.md) }]}>
          <Pressable accessibilityRole="button" style={styles.searchBar} onPress={() => openPlanner('place')}>
            <Text style={styles.searchIcon}>⌕</Text>
            <Text style={styles.searchText}>탐색 위치 검색</Text>
          </Pressable>
        </View>

        <View style={styles.floatingStack}>
          <Pressable accessibilityLabel="내 자투리 스팟 추가" accessibilityRole="button" style={styles.primaryFab} onPress={() => router.push('/spot/new')}>
            <Text style={styles.primaryFabText}>+</Text>
          </Pressable>
          <Pressable accessibilityLabel="현재 위치 기준 탐색" accessibilityRole="button" style={styles.fab} onPress={() => void handleCurrentNearbyBase()}>
            <Text style={styles.fabText}>◎</Text>
          </Pressable>
        </View>

        <View style={[styles.homeCtaWrap, { bottom: 100 + Math.max(insets.bottom, 0) }]}>
          <PrimaryButton label="틈새 탐색 시작" onPress={() => openPlanner('place')} />
        </View>

        <View style={[styles.bottomTabs, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <PlannerTab active icon="◉" label="틈새 탐색" onPress={() => openPlanner('place')} />
          <PlannerTab icon="☷" label="자투리 저장소" onPress={() => router.push('/saved')} />
          <PlannerTab icon="⚙" label="설정" onPress={() => router.push('/settings')} />
        </View>
      </SafeAreaView>

      <BottomSheet
        ref={sheetRef}
        backgroundStyle={styles.sheetBackground}
        enableDynamicSizing={false}
        enablePanDownToClose
        handleIndicatorStyle={styles.sheetHandle}
        index={-1}
        keyboardBehavior="interactive"
        snapPoints={snapPoints}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <ModeSelector mode={mode} onChangeMode={changeMode} />

          {step === 'place' ? (
            <PlaceStep
              mode={mode}
              searchState={searchState}
              originConfirmed={originConfirmed}
              destinationConfirmed={destinationConfirmed}
              nearbyConfirmed={nearbyConfirmed}
              onApplyCurrentLocation={applyCurrentLocation}
              onChangeText={(role, value) => dispatchSearch({ type: 'query', role, value })}
              onClose={closePlanner}
              onNext={nextFromPlace}
              onSearch={runPlaceSearch}
              onSelectPlace={selectPlace}
            />
          ) : null}

          {step === 'time' ? (
            <TimeStep
              spareMinutes={store.spareMinutes}
              onBack={() => setStep('place')}
              onNext={() => setStep('conditions')}
              onSetSpareMinutes={store.setSpareMinutes}
            />
          ) : null}

          {step === 'conditions' ? (
            <ConditionStep
              mode={mode}
              companion={store.companion}
              weather={store.weather}
              movementMode={store.nearbyMovementMode}
              needsBarrierFree={store.needsBarrierFree}
              prefersLowWalking={store.prefersLowWalking}
              includeReturn={store.nearbyIncludeReturn}
              onBack={() => setStep('time')}
              onSetCompanion={store.setCompanion}
              onSetIncludeReturn={store.setNearbyIncludeReturn}
              onSetMovementMode={store.setNearbyMovementMode}
              onSetNeedsBarrierFree={store.setNeedsBarrierFree}
              onSetPrefersLowWalking={store.setPrefersLowWalking}
              onSetWeather={store.setWeather}
              onStart={startJourney}
            />
          ) : null}

          {searchState.message ? <Text style={styles.messageText}>{searchState.message}</Text> : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

function PlannerTab({ active = false, icon, label, onPress }: { active?: boolean; icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={styles.tab} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabActive]}>{label}</Text>
    </Pressable>
  );
}

function ModeSelector({ mode, onChangeMode }: { mode: HomeMode; onChangeMode: (mode: HomeMode) => void }) {
  return (
    <View style={styles.segmented}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'moving' }}
        style={[styles.segment, mode === 'moving' && styles.segmentActive]}
        onPress={() => onChangeMode('moving')}
      >
        <Text style={styles.segmentIcon}>◇</Text>
        <Text style={styles.segmentText}>이동 자투리 탐색</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'nearby' }}
        style={[styles.segment, mode === 'nearby' && styles.segmentActive]}
        onPress={() => onChangeMode('nearby')}
      >
        <Text style={styles.segmentIcon}>●</Text>
        <Text style={styles.segmentText}>근처 자투리 탐색</Text>
      </Pressable>
    </View>
  );
}

function PlaceStep({
  mode,
  searchState,
  originConfirmed,
  destinationConfirmed,
  nearbyConfirmed,
  onApplyCurrentLocation,
  onChangeText,
  onClose,
  onNext,
  onSearch,
  onSelectPlace,
}: {
  mode: HomeMode;
  searchState: SearchState;
  originConfirmed: boolean;
  destinationConfirmed: boolean;
  nearbyConfirmed: boolean;
  onApplyCurrentLocation: (role: 'origin' | 'nearby') => Promise<void>;
  onChangeText: (role: PlaceSearchRole, value: string) => void;
  onClose: () => void;
  onNext: () => void;
  onSearch: (role: PlaceSearchRole) => Promise<void>;
  onSelectPlace: (role: PlaceSearchRole, place: PlaceSearchResult) => void;
}) {
  return (
    <View style={styles.stepGroup}>
      <Text style={styles.sheetTitle}>{mode === 'moving' ? '지금 어디로 가는 길인가요?' : '지금 어디에 있나요?'}</Text>
      {mode === 'moving' ? (
        <View style={styles.routeInputCard}>
          <SheetPlaceSearchField
            confirmed={originConfirmed}
            isLoading={searchState.searchingRole === 'origin'}
            placeholder="서울역"
            results={searchState.originResults}
            searchRole="origin"
            value={searchState.originQuery}
            onApplyCurrentLocation={() => void onApplyCurrentLocation('origin')}
            onChangeText={(value) => onChangeText('origin', value)}
            onSearch={() => void onSearch('origin')}
            onSelect={(place) => onSelectPlace('origin', place)}
          />
          <View style={styles.routeDivider} />
          <SheetPlaceSearchField
            confirmed={destinationConfirmed}
            isLoading={searchState.searchingRole === 'destination'}
            placeholder="강릉 안목해변"
            results={searchState.destinationResults}
            searchRole="destination"
            value={searchState.destinationQuery}
            onChangeText={(value) => onChangeText('destination', value)}
            onSearch={() => void onSearch('destination')}
            onSelect={(place) => onSelectPlace('destination', place)}
          />
        </View>
      ) : (
        <View style={styles.routeInputCard}>
          <SheetPlaceSearchField
            confirmed={nearbyConfirmed}
            isLoading={searchState.searchingRole === 'nearby'}
            placeholder="강릉역, 속초 숙소"
            results={searchState.nearbyResults}
            searchRole="nearby"
            value={searchState.nearbyQuery}
            onApplyCurrentLocation={() => void onApplyCurrentLocation('nearby')}
            onChangeText={(value) => onChangeText('nearby', value)}
            onSearch={() => void onSearch('nearby')}
            onSelect={(place) => onSelectPlace('nearby', place)}
          />
        </View>
      )}
      <View style={styles.sheetActions}>
        <SecondaryButton label="닫기" onPress={onClose} />
        <PrimaryButton label="다음" onPress={onNext} />
      </View>
    </View>
  );
}

function SheetPlaceSearchField({
  confirmed,
  isLoading,
  placeholder,
  results,
  searchRole,
  value,
  onApplyCurrentLocation,
  onChangeText,
  onSearch,
  onSelect,
}: {
  confirmed: boolean;
  isLoading: boolean;
  placeholder: string;
  results: PlaceSearchResult[];
  searchRole: PlaceSearchRole;
  value: string;
  onApplyCurrentLocation?: () => void;
  onChangeText: (value: string) => void;
  onSearch: () => void;
  onSelect: (place: PlaceSearchResult) => void;
}) {
  return (
    <View style={styles.placeField}>
      <View style={styles.placeInputRow}>
        <View
          style={[
            styles.routeDot,
            searchRole === 'destination' && styles.destinationDot,
            searchRole === 'nearby' && styles.nearbyDot,
          ]}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          style={styles.placeInput}
          value={value}
        />
        {onApplyCurrentLocation ? (
          <Pressable accessibilityRole="button" style={styles.currentLocationPill} onPress={onApplyCurrentLocation}>
            <Text style={styles.currentLocationText}>현위치</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" style={styles.searchSmallButton} onPress={onSearch}>
          <Text style={styles.searchSmallButtonText}>검색</Text>
        </Pressable>
      </View>
      <Text style={[styles.confirmationText, confirmed && styles.confirmedText]}>{confirmed ? '좌표 확정됨' : '검색 결과에서 장소를 선택해야 합니다'}</Text>
      {isLoading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.metaText}>검색 중</Text>
        </View>
      ) : null}
      {results.length > 0 ? (
        <View style={styles.resultList}>
          {results.map((place) => (
            <Pressable key={place.id} accessibilityRole="button" style={styles.resultItem} onPress={() => onSelect(place)}>
              <View style={styles.resultTextColumn}>
                <Text style={styles.resultTitle}>{place.name}</Text>
                <Text style={styles.resultAddress}>{place.address}</Text>
              </View>
              <Text style={styles.resultAction}>선택</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TimeStep({
  spareMinutes,
  onBack,
  onNext,
  onSetSpareMinutes,
}: {
  spareMinutes: number;
  onBack: () => void;
  onNext: () => void;
  onSetSpareMinutes: (minutes: number) => void;
}) {
  return (
    <View style={styles.stepGroup}>
      <Text style={styles.sheetTitle}>남는 자투리 시간은 얼마나 될까요?</Text>
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>15분</Text>
        <Text style={styles.timeLabel}>30분</Text>
        <Text style={styles.timeLabel}>1시간</Text>
        <Text style={styles.timeLabel}>2시간</Text>
      </View>
      <View style={styles.timeTrack}>
        {timeOptions.map((minutes) => (
          <Pressable
            key={minutes}
            accessibilityLabel={`${minutes}분 선택`}
            accessibilityRole="button"
            accessibilityState={{ selected: spareMinutes === minutes }}
            style={[styles.timeTick, spareMinutes === minutes && styles.timeTickActive]}
            onPress={() => onSetSpareMinutes(minutes)}
          />
        ))}
      </View>
      <View style={styles.timeInputBox}>
        <TextInput
          keyboardType="number-pad"
          onChangeText={(value) => {
            const parsed = Number(value.replace(/[^0-9]/g, ''));
            if (Number.isFinite(parsed) && parsed > 0) onSetSpareMinutes(Math.min(240, parsed));
          }}
          style={styles.timeInput}
          value={`${spareMinutes} 분`}
        />
      </View>
      <View style={styles.sheetActions}>
        <SecondaryButton label="이전" onPress={onBack} />
        <PrimaryButton label="다음" onPress={onNext} />
      </View>
    </View>
  );
}

function ConditionStep({
  mode,
  companion,
  weather,
  movementMode,
  needsBarrierFree,
  prefersLowWalking,
  includeReturn,
  onBack,
  onSetCompanion,
  onSetIncludeReturn,
  onSetMovementMode,
  onSetNeedsBarrierFree,
  onSetPrefersLowWalking,
  onSetWeather,
  onStart,
}: {
  mode: HomeMode;
  companion: CompanionType;
  weather: WeatherPreference;
  movementMode: MovementMode;
  needsBarrierFree: boolean;
  prefersLowWalking: boolean;
  includeReturn: boolean;
  onBack: () => void;
  onSetCompanion: (value: CompanionType) => void;
  onSetIncludeReturn: (value: boolean) => void;
  onSetMovementMode: (value: MovementMode) => void;
  onSetNeedsBarrierFree: (value: boolean) => void;
  onSetPrefersLowWalking: (value: boolean) => void;
  onSetWeather: (value: WeatherPreference) => void;
  onStart: () => void;
}) {
  return (
    <View style={styles.stepGroup}>
      <Text style={styles.sheetTitle}>어떤 틈새 여정이 좋을까요?</Text>
      <Text style={styles.metaText}>추천 품질에 영향 주는 조건만 빠르게 고릅니다.</Text>
      <View style={styles.chipGrid}>
        {companions.map((item) => (
          <Chip key={item.id} label={item.label} selected={companion === item.id} onPress={() => onSetCompanion(item.id)} />
        ))}
      </View>
      <View style={styles.chipGrid}>
        {weatherOptions.map((item) => (
          <Chip key={item.id} label={item.label} selected={weather === item.id} onPress={() => onSetWeather(item.id)} />
        ))}
      </View>
      {mode === 'nearby' ? (
        <View style={styles.chipGrid}>
          {movementModes.map((item) => (
            <Chip key={item.id} label={item.label} selected={movementMode === item.id} onPress={() => onSetMovementMode(item.id)} />
          ))}
          <Chip label="원위치 복귀 포함" selected={includeReturn} onPress={() => onSetIncludeReturn(!includeReturn)} />
        </View>
      ) : null}
      <View style={styles.chipGrid}>
        <Chip label="보행 적게" selected={prefersLowWalking} onPress={() => onSetPrefersLowWalking(!prefersLowWalking)} />
        <Chip label="접근성 우선" selected={needsBarrierFree} onPress={() => onSetNeedsBarrierFree(!needsBarrierFree)} />
      </View>
      <View style={styles.sheetActions}>
        <SecondaryButton label="이전" onPress={onBack} />
        <PrimaryButton label="틈새 여정 시작하기" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
  },
  searchBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceOverlayStrong,
    paddingHorizontal: spacing.lg,
    ...shadow.md,
  },
  searchIcon: {
    color: colors.ink,
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 42,
  },
  searchText: {
    color: colors.inkFaint,
    fontSize: 22,
    fontWeight: '800',
  },
  centerPinHalo: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24,
    backgroundColor: colors.overlayWarm,
  },
  centerPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  floatingStack: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 210,
    alignItems: 'center',
    gap: spacing.md,
  },
  primaryFab: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    backgroundColor: colors.primary,
    ...shadow.md,
  },
  primaryFabText: {
    color: colors.onPrimary,
    fontSize: 42,
    fontWeight: '500',
    lineHeight: 46,
  },
  fab: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    backgroundColor: colors.surfaceOverlayStrong,
    ...shadow.sm,
  },
  fabText: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 40,
  },
  homeCtaWrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
  },
  bottomTabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 88,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surfaceOverlayStrong,
    paddingTop: spacing.md,
    ...shadow.md,
  },
  tab: {
    minWidth: 92,
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabIcon: {
    color: colors.inkFaint,
    fontSize: 26,
    fontWeight: '900',
  },
  tabLabel: {
    color: colors.inkFaint,
    fontSize: 13,
    fontWeight: '800',
  },
  tabActive: {
    color: colors.ink,
  },
  sheetBackground: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  sheetHandle: {
    backgroundColor: colors.borderStrong,
    width: 48,
  },
  sheetContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    minHeight: 68,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  segmentIcon: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  segmentText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  stepGroup: {
    gap: spacing.lg,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 38,
  },
  routeInputCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  routeDivider: {
    height: 1,
    marginLeft: spacing.xl,
    backgroundColor: colors.border,
  },
  placeField: {
    gap: spacing.sm,
  },
  placeInputRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.inkFaint,
  },
  destinationDot: {
    backgroundColor: colors.primary,
  },
  nearbyDot: {
    backgroundColor: colors.blue,
  },
  placeInput: {
    minWidth: 0,
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    paddingVertical: spacing.sm,
  },
  currentLocationPill: {
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  currentLocationText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  searchSmallButton: {
    borderRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  searchSmallButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  confirmationText: {
    color: colors.inkFaint,
    fontSize: 12,
    fontWeight: '800',
  },
  confirmedText: {
    color: colors.success,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  messageText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  resultList: {
    gap: spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  resultTextColumn: {
    minWidth: 0,
    flex: 1,
    gap: spacing.xs,
  },
  resultTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  resultAddress: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  resultAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: '800',
  },
  timeTrack: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
  },
  timeTick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  timeTickActive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 4,
    ...shadow.sm,
  },
  timeInputBox: {
    minHeight: 72,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  timeInput: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
