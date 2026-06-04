import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useReducer } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge, Card, Chip, PrimaryButton, Screen, SecondaryButton, Section } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import type { CompanionType, WeatherPreference } from '@/domain/recommendation/types';
import type { PlaceSearchResult, PlaceSearchRole } from '@/services/routeProxy/client';
import { searchRouteProxyPlaces } from '@/services/routeProxy/client';
import { useTripStore } from '@/store/useTripStore';

const timeOptions = [30, 45, 60, 90, 120];
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

type SearchState = {
  originQuery: string;
  destinationQuery: string;
  originResults: PlaceSearchResult[];
  destinationResults: PlaceSearchResult[];
  searchingRole: PlaceSearchRole | null;
  message: string | null;
};

type SearchAction =
  | { type: 'query'; role: PlaceSearchRole; value: string }
  | { type: 'start'; role: PlaceSearchRole }
  | { type: 'results'; role: PlaceSearchRole; results: PlaceSearchResult[]; message?: string | null }
  | { type: 'message'; message: string | null }
  | { type: 'select'; role: PlaceSearchRole; place: PlaceSearchResult }
  | { type: 'currentLocation' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'query':
      return action.role === 'origin'
        ? { ...state, originQuery: action.value }
        : { ...state, destinationQuery: action.value };
    case 'start':
      return { ...state, searchingRole: action.role, message: null };
    case 'results':
      return action.role === 'origin'
        ? { ...state, originResults: action.results, searchingRole: null, message: action.message ?? null }
        : { ...state, destinationResults: action.results, searchingRole: null, message: action.message ?? null };
    case 'message':
      return { ...state, searchingRole: null, message: action.message };
    case 'select':
      return action.role === 'origin'
        ? { ...state, originQuery: action.place.name, originResults: [], message: null }
        : { ...state, destinationQuery: action.place.name, destinationResults: [], message: null };
    case 'currentLocation':
      return { ...state, originQuery: '현재 위치', originResults: [], message: null };
    default:
      return state;
  }
}

export default function HomeScreen() {
  const store = useTripStore();
  const [searchState, dispatchSearch] = useReducer(searchReducer, {
    originQuery: store.originName,
    destinationQuery: store.destinationName,
    originResults: [],
    destinationResults: [],
    searchingRole: null,
    message: null,
  });
  const canRecommend = store.originName.trim().length > 0 && store.destinationName.trim().length > 0;

  async function runPlaceSearch(role: PlaceSearchRole) {
    const query = role === 'origin' ? searchState.originQuery.trim() : searchState.destinationQuery.trim();

    if (query.length < 2) {
      dispatchSearch({ type: 'message', message: '두 글자 이상 입력하면 검색할 수 있어요.' });
      return;
    }

    dispatchSearch({ type: 'start', role });

    try {
      const response = await searchRouteProxyPlaces(query, role);
      const results = response?.results ?? [];
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

    store.setDestinationPlace(place.name, place.coordinate, place.id);
    dispatchSearch({ type: 'select', role, place });
  }

  async function useCurrentLocation() {
    if (Platform.OS === 'web') {
      Alert.alert('현재 위치를 쓸 수 없어요', '웹에서는 장소 검색으로 출발지를 선택해주세요.');
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('위치 권한이 필요해요', '검색 결과에서 출발지를 선택해주세요.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    const coordinate = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };

    store.setOriginPlace('현재 위치', coordinate);
    dispatchSearch({ type: 'currentLocation' });
  }

  function goToRecommendations() {
    if (!canRecommend) {
      Alert.alert('출발지와 목적지를 선택해주세요', '검색 결과에서 출발지와 목적지를 하나씩 선택하면 추천을 계산할 수 있어요.');
      return;
    }

    router.push('/recommendations');
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label={canRecommend ? '실제 경로로 추천 보기' : '출발지와 목적지를 선택해주세요'}
          onPress={goToRecommendations}
        />
      }
    >
      <View style={styles.hero}>
        <Badge label="강원 자가용 여행 MVP" tone="blue" />
        <Text style={styles.title}>자투리여행</Text>
        <Text style={styles.description}>출발지와 목적지를 기준으로 실제 경유 시간이 납득되는 짧은 여행 후보를 비교합니다.</Text>
      </View>

      <Section title="출발 · 목적지">
        <Card>
          <PlaceSearchField
            label="출발지"
            placeholder="예: 서울시청, 하남검단산역, 현재 주소"
            value={searchState.originQuery}
            selectedName={store.originName}
            results={searchState.originResults}
            isLoading={searchState.searchingRole === 'origin'}
            onChangeText={(value) => dispatchSearch({ type: 'query', role: 'origin', value })}
            onSearch={() => void runPlaceSearch('origin')}
            onSelect={(place) => selectPlace('origin', place)}
          />

          <View style={styles.locationActionRow}>
            <SecondaryButton label="현재 위치로 출발" onPress={useCurrentLocation} />
          </View>

          <PlaceSearchField
            label="목적지"
            placeholder="예: 속초 중앙시장, 오죽헌, 강릉 커피거리"
            value={searchState.destinationQuery}
            selectedName={store.destinationName}
            results={searchState.destinationResults}
            isLoading={searchState.searchingRole === 'destination'}
            onChangeText={(value) => dispatchSearch({ type: 'query', role: 'destination', value })}
            onSearch={() => void runPlaceSearch('destination')}
            onSelect={(place) => selectPlace('destination', place)}
          />

          {searchState.message ? <Text style={styles.messageText}>{searchState.message}</Text> : null}

          <View style={styles.routeStatusRow}>
            <View style={styles.routeStatusCopy}>
              <Text style={styles.cardTitle}>
                {store.originName || '출발지 선택 필요'} → {store.destinationName || '목적지 선택 필요'}
              </Text>
              <Text style={styles.cardText}>선택한 두 좌표를 기준으로 기본 경로와 관광 경유 경로를 비교합니다.</Text>
            </View>
            <Badge label={canRecommend ? '좌표 확정' : '검색 필요'} tone={canRecommend ? 'green' : 'amber'} />
          </View>
        </Card>
      </Section>

      <Section title="남는 시간">
        <View style={styles.chipGrid}>
          {timeOptions.map((minutes) => (
            <Chip key={minutes} label={`${minutes}분`} selected={store.spareMinutes === minutes} onPress={() => store.setSpareMinutes(minutes)} />
          ))}
        </View>
      </Section>

      <Section title="상황 조건">
        <View style={styles.chipGrid}>
          {companions.map((item) => (
            <Chip key={item.id} label={item.label} selected={store.companion === item.id} onPress={() => store.setCompanion(item.id)} />
          ))}
        </View>
        <View style={styles.chipGrid}>
          {weatherOptions.map((item) => (
            <Chip key={item.id} label={item.label} selected={store.weather === item.id} onPress={() => store.setWeather(item.id)} />
          ))}
        </View>
        <View style={styles.chipGrid}>
          <Chip label="보행 적게" selected={store.prefersLowWalking} onPress={() => store.setPrefersLowWalking(!store.prefersLowWalking)} />
          <Chip label="접근성 우선" selected={store.needsBarrierFree} onPress={() => store.setNeedsBarrierFree(!store.needsBarrierFree)} />
        </View>
      </Section>

      <View style={styles.quickLinks}>
        <SecondaryButton label="저장한 장소" onPress={() => router.push('/saved')} />
        <SecondaryButton label="설정" onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}

function PlaceSearchField({
  label,
  placeholder,
  value,
  selectedName,
  results,
  isLoading,
  onChangeText,
  onSearch,
  onSelect,
}: {
  label: string;
  placeholder: string;
  value: string;
  selectedName: string;
  results: PlaceSearchResult[];
  isLoading: boolean;
  onChangeText: (value: string) => void;
  onSearch: () => void;
  onSelect: (place: PlaceSearchResult) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {selectedName ? <Badge label="선택됨" tone="blue" /> : null}
      </View>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          style={styles.input}
          value={value}
        />
        <SecondaryButton label="검색" onPress={onSearch} />
      </View>
      {isLoading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.cardText}>검색 중</Text>
        </View>
      ) : null}
      {results.length > 0 ? (
        <View style={styles.resultList}>
          {results.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              style={({ pressed }) => [styles.resultItem, pressed && styles.pressed]}
              onPress={() => onSelect(place)}
            >
              <View style={styles.resultTextColumn}>
                <Text style={styles.resultTitle}>{place.name}</Text>
                <Text style={styles.resultAddress}>{place.address}</Text>
                <Text style={styles.resultMeta}>{place.sourceLabel} · {place.categoryLabel}</Text>
              </View>
              <Text style={styles.resultAction}>선택</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  input: {
    minHeight: 46,
    minWidth: 0,
    flex: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
  },
  locationActionRow: {
    alignItems: 'flex-start',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  resultList: {
    gap: spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
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
  resultMeta: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  resultAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  routeStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  routeStatusCopy: {
    minWidth: 190,
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  cardText: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.76,
  },
});
