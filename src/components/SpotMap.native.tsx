import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { TravelSpot } from '@/domain/recommendation/types';
import { buildOpenStreetMapEmbedUrl } from '@/utils/openStreetMap';

export function SpotMap({ spot }: { spot: TravelSpot }) {
  return (
    <View style={styles.wrapper}>
      <WebView
        originWhitelist={['https://www.openstreetmap.org']}
        source={{ uri: buildOpenStreetMapEmbedUrl(spot.coordinate) }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 220,
    overflow: 'hidden',
    borderRadius: 8,
  },
  map: {
    flex: 1,
  },
});
