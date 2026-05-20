import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge, Card, Chip, PrimaryButton, Screen, SecondaryButton, Section } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { defaultOrigin, destinationPresets, originPresets } from '@/data/destinations';
import type { CompanionType, WeatherPreference } from '@/domain/recommendation/types';
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

function normalizePlaceName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

export default function HomeScreen() {
  const [locationStatus, setLocationStatus] = useState('서울시청 출발 기준');
  const store = useTripStore();
  const destination = destinationPresets.find((item) => item.id === store.destinationId) ?? destinationPresets[0];

  function selectOrigin(originId: string) {
    const origin = originPresets.find((item) => item.id === originId) ?? originPresets[0];
    store.setOriginPlace(origin.name, origin.coordinate);
    setLocationStatus(`${origin.name} 출발 기준`);
  }

  function updateOriginName(originName: string) {
    store.setOriginName(originName);
    const match = originPresets.find((item) => normalizePlaceName(item.name) === normalizePlaceName(originName));

    if (match) {
      store.setOriginPlace(match.name, match.coordinate);
      setLocationStatus(`${match.name} 출발 기준`);
    }
  }

  function updateDestinationName(destinationName: string) {
    store.setDestinationName(destinationName);
    const match = destinationPresets.find((item) => normalizePlaceName(item.name) === normalizePlaceName(destinationName));

    if (match) {
      store.setDestinationId(match.id);
    }
  }

  async function useCurrentLocation() {
    if (Platform.OS === 'web') {
      setLocationStatus('웹에서는 서울시청 출발 기준');
      store.setOriginPlace(originPresets[0].name, defaultOrigin);
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('위치 권한이 필요해요', '현재 위치 대신 서울시청 출발 기준으로 추천을 계산합니다.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    store.setOriginPlace('현재 위치', {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });
    setLocationStatus('현재 위치 출발 기준');
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label="카카오 경로로 추천 보기"
          onPress={() => {
            router.push('/recommendations');
          }}
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
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>출발지</Text>
            <TextInput
              accessibilityLabel="출발지"
              autoCapitalize="none"
              onChangeText={updateOriginName}
              placeholder="서울시청"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
              value={store.originName}
            />
            <View style={styles.chipGrid}>
              {originPresets.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  selected={normalizePlaceName(store.originName) === normalizePlaceName(item.name)}
                  onPress={() => selectOrigin(item.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>목적지</Text>
            <TextInput
              accessibilityLabel="목적지"
              autoCapitalize="none"
              onChangeText={updateDestinationName}
              placeholder="강릉"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
              value={store.destinationName}
            />
            <View style={styles.chipGrid}>
              {destinationPresets.map((item) => (
                <Chip key={item.id} label={item.name} selected={store.destinationId === item.id} onPress={() => store.setDestinationId(item.id)} />
              ))}
            </View>
          </View>

          <View style={styles.routeStatusRow}>
            <View style={styles.routeStatusCopy}>
              <Text style={styles.cardTitle}>{store.originName} → {destination.name}</Text>
              <Text style={styles.cardText}>{locationStatus} · {destination.description}</Text>
            </View>
            <SecondaryButton label="현재 위치" onPress={useCurrentLocation} />
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
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 46,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
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
});
