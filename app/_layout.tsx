import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import { useTripStore } from '@/store/useTripStore';

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const hydrate = useTripStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.ink,
              headerTitleStyle: { fontWeight: '800' },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false, title: '자투리여행' }} />
            <Stack.Screen name="recommendations" options={{ title: '추천 결과' }} />
            <Stack.Screen name="nearby" options={{ title: '주변 추천' }} />
            <Stack.Screen name="spot/[id]" options={{ title: '스팟 상세' }} />
            <Stack.Screen name="spot/new" options={{ title: '내 스팟 추가' }} />
            <Stack.Screen name="saved" options={{ title: '저장한 장소' }} />
            <Stack.Screen name="settings" options={{ title: '설정' }} />
          </Stack>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
