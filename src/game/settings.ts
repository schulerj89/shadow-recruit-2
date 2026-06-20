import type { GameSettings, PerformanceProfile } from './types';

const storageKey = 'shadow-recruit-2-settings-v1';

export const defaultSettings: GameSettings = {
  debug: false,
  muted: false,
  performanceProfile: 'balanced',
};

export function loadSettings(): GameSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Partial<GameSettings> | null;
    return sanitizeSettings(parsed);
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(storageKey, JSON.stringify(sanitizeSettings(settings)));
}

export function sanitizeSettings(value: Partial<GameSettings> | null | undefined): GameSettings {
  return {
    debug: typeof value?.debug === 'boolean' ? value.debug : defaultSettings.debug,
    muted: typeof value?.muted === 'boolean' ? value.muted : defaultSettings.muted,
    performanceProfile: isPerformanceProfile(value?.performanceProfile)
      ? value.performanceProfile
      : defaultSettings.performanceProfile,
  };
}

export function isPerformanceProfile(value: unknown): value is PerformanceProfile {
  return value === 'performance' || value === 'balanced' || value === 'cinematic';
}
