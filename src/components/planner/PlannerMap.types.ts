import type { StyleProp, ViewStyle } from 'react-native';

import type { Coordinate } from '@/domain/recommendation/types';

export type PlannerMapCandidate = {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
};

export type PlannerMapProps = {
  originCoordinate?: Coordinate | null;
  destinationCoordinate?: Coordinate | null;
  baseCoordinate?: Coordinate | null;
  candidateMarkers?: readonly PlannerMapCandidate[];
  highlightedCandidateId?: string | null;
  interactive?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};
