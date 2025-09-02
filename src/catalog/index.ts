import type { SchoolProvider } from './types';
import { sfu } from './sfu';
import { ubc } from './ubc';
// Future: import { langara } from './langara'; import { douglas } from './douglas'; import { kpu } from './kpu';

export const providers: Record<string, SchoolProvider> = {
  sfu,
  ubc,
  // langara,
  // douglas,
  // kpu,
};
