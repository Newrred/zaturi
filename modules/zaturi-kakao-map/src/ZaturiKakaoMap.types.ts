import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

export type OnTapEventPayload = Record<string, never>;

export type ZaturiKakaoMapErrorEvent = {
  code: string;
  message: string;
};

export type ZaturiKakaoMapViewProps = {
  appKey?: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  markersJson?: string;
  zoomLevel?: number;
  onMapReady?: () => void;
  onMapError?: (event: NativeSyntheticEvent<ZaturiKakaoMapErrorEvent>) => void;
  style?: StyleProp<ViewStyle>;
};
