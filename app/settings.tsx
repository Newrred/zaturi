import { StyleSheet, Text } from 'react-native';

import { Card, Screen, Section } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>설정</Text>
      <Section title="프로토타입 범위">
        <Card>
          <Text style={styles.text}>
            현재 버전은 TourAPI 형태의 Mock 데이터를 사용합니다. 추천 로직은 남는 시간, 경로 이탈 추정, 주차, 접근성, 날씨 조건을 설명 가능한 규칙으로 반영합니다.
          </Text>
        </Card>
      </Section>
      <Section title="데이터 출처 방향">
        <Card>
          <Text style={styles.text}>향후 한국관광공사 TourAPI, 무장애 여행 정보, 강원 공식 드라이브 코스, 날씨/교통 데이터를 앱 내부 모델로 정규화해 연결합니다.</Text>
        </Card>
      </Section>
      <Section title="지도와 내비게이션">
        <Card>
          <Text style={styles.text}>앱은 자체 내비게이션을 제공하지 않고, 선택한 장소를 외부 지도 앱으로 넘기는 MVP 흐름을 우선 사용합니다.</Text>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  text: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
