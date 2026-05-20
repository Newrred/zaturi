import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { TravelSpot } from '@/domain/recommendation/types';

export function SpotMap({ spot }: { spot: TravelSpot }) {
  return (
    <View style={styles.wrapper}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: spot.coordinate.latitude,
          longitude: spot.coordinate.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        <Marker coordinate={spot.coordinate} title={spot.name} description={spot.address} />
      </MapView>
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
