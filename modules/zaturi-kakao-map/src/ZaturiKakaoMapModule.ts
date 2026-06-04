import { NativeModule, requireNativeModule } from 'expo';

declare class ZaturiKakaoMapModule extends NativeModule<{}> {}

export default requireNativeModule<ZaturiKakaoMapModule>('ZaturiKakaoMap');
