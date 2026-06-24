declare module '@/components/planner/PlannerMap' {
  import type { ReactElement } from 'react';
  import type { PlannerMapCandidate, PlannerMapProps } from '@/components/planner/PlannerMap.types';

  export type { PlannerMapCandidate, PlannerMapProps };

  export function PlannerMap(props: PlannerMapProps): ReactElement;
}
