import shadowOperativeIdleUrl from '../assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import shadowOperativeRunUrl from '../assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import echoVanguardIdleUrl from '../assets/hero/hero_2/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import echoVanguardRunUrl from '../assets/hero/hero_2/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import signalWardenIdleUrl from '../assets/hero/hero_3/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import signalWardenRunUrl from '../assets/hero/hero_3/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import circuitNomadIdleUrl from '../assets/hero/hero_4/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import circuitNomadRunUrl from '../assets/hero/hero_4/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';

export const heroOptions = [
  {
    id: 'shadow-operative',
    name: 'Shadow Operative',
    role: 'Balanced infiltrator',
    description: 'Original compact field suit with readable stealth silhouettes.',
    accentColor: '#53ffe2',
    idleUrl: shadowOperativeIdleUrl,
    runUrl: shadowOperativeRunUrl,
  },
  {
    id: 'echo-vanguard',
    name: 'Echo Vanguard',
    role: 'Heavy recon kit',
    description: 'Bulkier tactical read for command-room and corridor play.',
    accentColor: '#7dfcc6',
    idleUrl: echoVanguardIdleUrl,
    runUrl: echoVanguardRunUrl,
  },
  {
    id: 'signal-warden',
    name: 'Signal Warden',
    role: 'Fast response suit',
    description: 'Sharper high-contrast profile for faster route scouting.',
    accentColor: '#5ad7ff',
    idleUrl: signalWardenIdleUrl,
    runUrl: signalWardenRunUrl,
  },
  {
    id: 'circuit-nomad',
    name: 'Circuit Nomad',
    role: 'Adaptive scout',
    description: 'Gold-accented suit tuned for objective-heavy sorties.',
    accentColor: '#ffd45a',
    idleUrl: circuitNomadIdleUrl,
    runUrl: circuitNomadRunUrl,
  },
] as const;

export type HeroOption = (typeof heroOptions)[number];
export type HeroId = HeroOption['id'];

export const defaultHeroId: HeroId = 'shadow-operative';

export function heroOptionById(heroId: HeroId): HeroOption {
  return heroOptions.find((hero) => hero.id === heroId) ?? heroOptions[0];
}

export function isHeroId(value: unknown): value is HeroId {
  return heroOptions.some((hero) => hero.id === value);
}
