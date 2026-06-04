import { requireNativeView } from 'expo';
import * as React from 'react';

import { ZaturiKakaoMapViewProps } from './ZaturiKakaoMap.types';

const NativeView: React.ComponentType<ZaturiKakaoMapViewProps> = requireNativeView('ZaturiKakaoMap');

export default function ZaturiKakaoMapView(props: ZaturiKakaoMapViewProps) {
  return <NativeView {...props} />;
}
