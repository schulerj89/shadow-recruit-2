import geometry from '../../../data/levels/relay-vault.geometry.json';
import type { LevelDefinition } from '../types';
import { levelFromGeometry, type LevelGeometrySource } from './levelFromGeometry';

export const relayVaultLevel: LevelDefinition = levelFromGeometry(geometry as LevelGeometrySource);
