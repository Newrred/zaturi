import { registerWebModule, NativeModule } from 'expo';

// ZaturiKakaoMapModule is not available on the web platform.
class ZaturiKakaoMapModule extends NativeModule<{}> {}

export default registerWebModule(ZaturiKakaoMapModule, 'ZaturiKakaoMapModule');
