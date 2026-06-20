import geometry from '../../../data/levels/level-one.geometry.json';
import type { LevelDefinition } from '../types';
import { levelFromGeometry, type LevelGeometrySource } from './levelFromGeometry';

export const levelOne: LevelDefinition = levelFromGeometry(geometry as LevelGeometrySource);
