import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function getLevelsDir(root = process.cwd()) {
  return path.join(root, 'src', 'game', 'levels');
}

export function getLevelRegistryPath(root = process.cwd()) {
  return path.join(getLevelsDir(root), 'index.ts');
}

export function collectLevelAdapters({ root = process.cwd(), extraAdapters = [] } = {}) {
  const levelsDir = getLevelsDir(root);
  const adapters = new Map();

  if (existsSync(levelsDir)) {
    for (const file of readdirSync(levelsDir).filter((entry) => entry.endsWith('.ts') && entry !== 'index.ts')) {
      const filePath = path.join(levelsDir, file);
      const source = readFileSync(filePath, 'utf8');
      const adapter = parseLevelAdapter({ file, source });
      if (adapter) adapters.set(adapter.moduleName, adapter);
    }
  }

  for (const extra of extraAdapters) {
    const adapter = parseLevelAdapter(extra);
    if (adapter) adapters.set(adapter.moduleName, adapter);
  }

  return [...adapters.values()].sort(compareAdapters);
}

export function parseLevelAdapter({ file, source }) {
  const moduleName = file.replace(/\.ts$/, '');
  const geometryMatch = source.match(/from ['"]\.\.\/\.\.\/\.\.\/data\/levels\/([^'"]+\.geometry\.json)['"]/);
  const exportMatch = source.match(/export\s+const\s+([A-Za-z0-9_$]+)\s*:\s*LevelDefinition\s*=/);

  if (!geometryMatch || !exportMatch) return null;

  return {
    file,
    moduleName,
    exportName: exportMatch[1],
    geometryFile: geometryMatch[1],
  };
}

export function formatLevelRegistry(adapters) {
  if (adapters.length === 0) {
    throw new Error('Cannot generate level registry without at least one LevelDefinition adapter.');
  }

  const importLines = adapters.map((adapter) => `import { ${adapter.exportName} } from './${adapter.moduleName}';`);
  const levelNames = adapters.map((adapter) => adapter.exportName);
  const defaultLevel = levelNames.includes('levelOne') ? 'levelOne' : levelNames[0];

  return `${importLines.join('\n')}
import type { LevelCatalogEntry, LevelDefinition } from '../types';

export const defaultLevel = ${defaultLevel};
export const levels = [${levelNames.join(', ')}] as const satisfies readonly LevelDefinition[];

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
`;
}

function compareAdapters(left, right) {
  if (left.exportName === 'levelOne') return -1;
  if (right.exportName === 'levelOne') return 1;
  return left.moduleName.localeCompare(right.moduleName);
}
