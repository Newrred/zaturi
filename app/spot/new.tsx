import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge, Card, Chip, PrimaryButton, Screen, SecondaryButton, Section } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { createUserSpotId } from '@/domain/recommendation/userSpots';
import { useTripStore } from '@/store/useTripStore';

function numberText(value: number) {
  return Number.isFinite(value) ? String(Number(value.toFixed(6))) : '';
}

function parseTags(value: string) {
  return value
    .split(',')
    .flatMap((tag) => {
      const trimmed = tag.trim();
      return trimmed ? [trimmed] : [];
    })
    .slice(0, 6);
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export default function NewSpotScreen() {
  const addUserSpot = useTripStore((state) => state.addUserSpot);
  const nearbyBaseName = useTripStore((state) => state.nearbyBaseName);
  const nearbyBaseCoordinate = useTripStore((state) => state.nearbyBaseCoordinate);
  const originCoordinate = useTripStore((state) => state.originCoordinate);
  const defaultCoordinate = nearbyBaseName ? nearbyBaseCoordinate : originCoordinate;
  const [name, setName] = useState('');
  const [address, setAddress] = useState(nearbyBaseName ? `${nearbyBaseName} 근처` : '');
  const [area, setArea] = useState('');
  const [summary, setSummary] = useState('');
  const [latitude, setLatitude] = useState(() => numberText(defaultCoordinate.latitude));
  const [longitude, setLongitude] = useState(() => numberText(defaultCoordinate.longitude));
  const [stayMinutes, setStayMinutes] = useState('30');
  const [walkingMinutes, setWalkingMinutes] = useState('8');
  const [tags, setTags] = useState('직접추가');
  const [parking, setParking] = useState(true);
  const [barrierFree, setBarrierFree] = useState(false);
  const [kidFriendly, setKidFriendly] = useState(true);
  const [indoor, setIndoor] = useState(false);
  const [rainFit, setRainFit] = useState(false);
  const parsedStayMinutes = useMemo(() => Number(stayMinutes), [stayMinutes]);
  const parsedWalkingMinutes = useMemo(() => Number(walkingMinutes), [walkingMinutes]);

  function saveSpot() {
    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);
    const stayNumber = Number(stayMinutes);
    const walkingNumber = Number(walkingMinutes);

    if (!name.trim()) {
      Alert.alert('이름이 필요해요', '내 자투리 스팟 이름을 입력해주세요.');
      return;
    }

    if (!isValidLatitude(latitudeNumber) || !isValidLongitude(longitudeNumber)) {
      Alert.alert('좌표를 확인해주세요', '위도는 -90~90, 경도는 -180~180 범위의 숫자로 입력해야 합니다.');
      return;
    }

    if (!Number.isFinite(stayNumber) || stayNumber <= 0 || !Number.isInteger(stayNumber)) {
      Alert.alert('체류 시간을 확인해주세요', '체류 시간은 1분 이상의 정수로 입력해주세요.');
      return;
    }

    if (!Number.isFinite(walkingNumber) || walkingNumber < 0 || !Number.isInteger(walkingNumber)) {
      Alert.alert('보행 시간을 확인해주세요', '보행 시간은 0분 이상의 정수로 입력해주세요.');
      return;
    }

    addUserSpot({
      id: createUserSpotId(),
      name: name.trim(),
      address: address.trim() || '직접 추가한 위치',
      area: area.trim() || '내 장소',
      coordinate: {
        latitude: latitudeNumber,
        longitude: longitudeNumber,
      },
      summary: summary.trim() || `${stayNumber}분 정도 머물기 좋은 직접 추가 자투리 장소입니다.`,
      stayMinutes: stayNumber,
      walkingMinutes: walkingNumber,
      parking,
      barrierFree,
      kidFriendly,
      indoor,
      weatherFit: rainFit || indoor ? ['any', 'rain'] : ['any', 'sunny'],
      tags: parseTags(tags),
      createdAt: new Date().toISOString(),
    });

    router.replace('/saved');
  }

  return (
    <Screen
      footer={
        <View style={styles.footerButtons}>
          <SecondaryButton label="취소" onPress={() => router.back()} />
          <PrimaryButton label="내 스팟 저장" onPress={saveSpot} />
        </View>
      }
    >
      <View style={styles.header}>
        <Badge label="로컬 MVP" tone="blue" />
        <Text style={styles.title}>내 자투리 스팟 추가</Text>
        <Text style={styles.description}>등록되지 않은 작은 장소를 저장해두면 주변 추천과 경유 추천 후보에 함께 반영합니다.</Text>
      </View>

      <Section title="기본 정보">
        <Card>
          <FormField label="이름" placeholder="예: 숙소 앞 조용한 산책로" value={name} onChangeText={setName} />
          <FormField label="주소 또는 메모" placeholder="장소를 다시 찾을 수 있는 설명" value={address} onChangeText={setAddress} />
          <FormField label="지역" placeholder="예: 강릉, 속초, 내 주변" value={area} onChangeText={setArea} />
          <FormField
            label="한 줄 설명"
            multiline
            placeholder="어떤 남는 시간에 쓰기 좋은 장소인지"
            value={summary}
            onChangeText={setSummary}
          />
        </Card>
      </Section>

      <Section title="좌표">
        <Card>
          <View style={styles.coordinateRow}>
            <FormField label="위도" keyboardType="decimal-pad" value={latitude} onChangeText={setLatitude} />
            <FormField label="경도" keyboardType="decimal-pad" value={longitude} onChangeText={setLongitude} />
          </View>
          <Text style={styles.helpText}>기본값은 현재 선택된 주변 기준점 또는 출발지 좌표입니다. 지도에서 정확히 찍는 기능은 다음 단계에서 붙입니다.</Text>
        </Card>
      </Section>

      <Section title="시간과 조건">
        <Card>
          <View style={styles.coordinateRow}>
            <FormField label="체류 시간" keyboardType="number-pad" value={stayMinutes} onChangeText={setStayMinutes} />
            <FormField label="보행 시간" keyboardType="number-pad" value={walkingMinutes} onChangeText={setWalkingMinutes} />
          </View>
          <Text style={styles.helpText}>
            현재 입력 기준: 체류 {Number.isFinite(parsedStayMinutes) ? parsedStayMinutes : '-'}분 · 보행{' '}
            {Number.isFinite(parsedWalkingMinutes) ? parsedWalkingMinutes : '-'}분
          </Text>
          <View style={styles.chipGrid}>
            <Chip label="주차 가능" selected={parking} onPress={() => setParking(!parking)} />
            <Chip label="접근성 우선" selected={barrierFree} onPress={() => setBarrierFree(!barrierFree)} />
            <Chip label="아이 동반 가능" selected={kidFriendly} onPress={() => setKidFriendly(!kidFriendly)} />
            <Chip label="실내" selected={indoor} onPress={() => setIndoor(!indoor)} />
            <Chip label="비 오는 날 가능" selected={rainFit} onPress={() => setRainFit(!rainFit)} />
          </View>
          <FormField label="태그" placeholder="쉼, 산책, 사진" value={tags} onChangeText={setTags} />
        </Card>
      </Section>
    </Screen>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, multiline && styles.textArea]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  description: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  fieldGroup: {
    flex: 1,
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 46,
    minWidth: 0,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
  },
  textArea: {
    minHeight: 90,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helpText: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
