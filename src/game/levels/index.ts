import { levelOne } from './levelOne';
import { relayVaultLevel } from './relayVault';
import type { LevelCatalogEntry, LevelDefinition } from '../types';

export const defaultLevel = levelOne;
export const levels = [levelOne, relayVaultLevel] as const satisfies readonly LevelDefinition[];

export const levelCatalog: readonly LevelCatalogEntry[] = levels.map((level) => ({
  id: level.id,
  name: level.name,
  chapter: level.chapter,
  objectiveCount: level.objectives.filter((objective) => objective.required).length,
  enemyCount: level.enemies.length,
}));

export function getLevelById(levelId: string): LevelDefinition | undefined {
  return levels.find((level) => level.id === levelId);
}
