declare module '@/components/SpotMap' {
  import type { ReactElement } from 'react';
  import type { TravelSpot } from '@/domain/recommendation/types';

  export function SpotMap(props: { spot: TravelSpot }): ReactElement;
}
