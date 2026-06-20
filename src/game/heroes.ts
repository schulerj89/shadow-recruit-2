import shadowOperativeIdleUrl from '../assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import shadowOperativeRunUrl from '../assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import echoVanguardIdleUrl from '../assets/hero/hero_2/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import echoVanguardRunUrl from '../assets/hero/hero_2/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import signalWardenIdleUrl from '../assets/hero/hero_3/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import signalWardenRunUrl from '../assets/hero/hero_3/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import circuitNomadIdleUrl from '../assets/hero/hero_4/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb?url';
import circuitNomadRunUrl from '../assets/hero/hero_4/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb?url';
import type { OperativeTraitDefinition } from './types';

const seedAssetNote = 'Hash-matched against the local Shadow Circuit seed asset during the v0.13.4 provenance audit.';

function trait(definition: OperativeTraitDefinition): OperativeTraitDefinition {
  return definition;
}

export const heroOptions = [
  {
    id: 'shadow-operative',
    name: 'Shadow Operative',
    role: 'Balanced infiltrator',
    description: 'Original compact field suit with readable stealth silhouettes.',
    traitSummary: ['Baseline move speed', 'Standard sentry signature', 'Standard objective reach'],
    traits: [
      trait({
        id: 'balanced-kit',
        label: 'Balanced field kit',
        mechanic: 'survivability',
        scalar: 'moveSpeed',
        operation: 'multiplier',
        value: 1,
        notes: ['Baseline operative keeps default movement, detection, interaction, and extraction tuning for control comparisons.'],
      }),
    ],
    accentColor: '#53ffe2',
    idleUrl: shadowOperativeIdleUrl,
    runUrl: shadowOperativeRunUrl,
    idlePath: 'src/assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb',
    runPath: 'src/assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb',
    provenance: 'sneak-game-seed',
    provenanceNotes: [seedAssetNote],
  },
  {
    id: 'echo-vanguard',
    name: 'Echo Vanguard',
    role: 'Heavy recon kit',
    description: 'Bulkier tactical read for command-room and corridor play.',
    traitSummary: ['Lower sentry contact radius', 'Slightly slower movement', 'Wider objective reach'],
    traits: [
      trait({
        id: 'echo-dampeners',
        label: 'Echo dampeners',
        mechanic: 'stealth',
        scalar: 'enemyDetectionRadius',
        operation: 'multiplier',
        value: 0.88,
        notes: ['Heavy recon kit reduces effective sentry contact radius so stealth choice changes enemy risk.'],
      }),
      trait({
        id: 'armored-step',
        label: 'Armored step',
        mechanic: 'movement',
        scalar: 'moveSpeed',
        operation: 'multiplier',
        value: 0.92,
        notes: ['Extra armor slows traversal enough for QA to detect a scalar change without breaking Level 1 routes.'],
      }),
      trait({
        id: 'long-reach-interface',
        label: 'Long-reach interface',
        mechanic: 'interaction',
        scalar: 'interactRadius',
        operation: 'add',
        value: 0.15,
        notes: ['Objective reach is slightly wider so interaction range changes are visible in deterministic probes.'],
      }),
    ],
    accentColor: '#7dfcc6',
    idleUrl: echoVanguardIdleUrl,
    runUrl: echoVanguardRunUrl,
    idlePath: 'src/assets/hero/hero_2/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb',
    runPath: 'src/assets/hero/hero_2/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb',
    provenance: 'sneak-game-seed',
    provenanceNotes: [seedAssetNote],
  },
  {
    id: 'signal-warden',
    name: 'Signal Warden',
    role: 'Fast response suit',
    description: 'Sharper high-contrast profile for faster route scouting.',
    traitSummary: ['Faster route scouting', 'Louder sentry signature', 'Standard objective reach'],
    traits: [
      trait({
        id: 'overclocked-servos',
        label: 'Overclocked servos',
        mechanic: 'movement',
        scalar: 'moveSpeed',
        operation: 'multiplier',
        value: 1.1,
        notes: ['Fast response suit increases effective movement speed for route-scouting differentiation.'],
      }),
      trait({
        id: 'signal-bleed',
        label: 'Signal bleed',
        mechanic: 'stealth',
        scalar: 'enemyDetectionRadius',
        operation: 'multiplier',
        value: 1.08,
        notes: ['Higher signal profile increases contact risk so faster movement has a readable stealth tradeoff.'],
      }),
    ],
    accentColor: '#5ad7ff',
    idleUrl: signalWardenIdleUrl,
    runUrl: signalWardenRunUrl,
    idlePath: 'src/assets/hero/hero_3/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb',
    runPath: 'src/assets/hero/hero_3/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb',
    provenance: 'sneak-game-seed',
    provenanceNotes: [seedAssetNote],
  },
  {
    id: 'circuit-nomad',
    name: 'Circuit Nomad',
    role: 'Adaptive scout',
    description: 'Gold-accented suit tuned for objective-heavy sorties.',
    traitSummary: ['Widest objective reach', 'Larger extraction hold zone', 'Slightly faster terminal use'],
    traits: [
      trait({
        id: 'adaptive-interface',
        label: 'Adaptive interface',
        mechanic: 'interaction',
        scalar: 'interactRadius',
        operation: 'add',
        value: 0.45,
        notes: ['Objective-heavy kit expands the usable interaction radius for keycard, terminal, and code pickup.'],
      }),
      trait({
        id: 'exfil-beacon-link',
        label: 'Exfil beacon link',
        mechanic: 'objective',
        scalar: 'extractionRadius',
        operation: 'add',
        value: 0.35,
        notes: ['Extraction link broadens the completion zone without moving the authored extraction coordinate.'],
      }),
      trait({
        id: 'hotwire-stack',
        label: 'Hotwire stack',
        mechanic: 'hacking',
        scalar: 'terminalUseMs',
        operation: 'multiplier',
        value: 0.9,
        notes: ['Terminal-use timing is surfaced for future objective interactions and deterministic QA probes.'],
      }),
    ],
    accentColor: '#ffd45a',
    idleUrl: circuitNomadIdleUrl,
    runUrl: circuitNomadRunUrl,
    idlePath: 'src/assets/hero/hero_4/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb',
    runPath: 'src/assets/hero/hero_4/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb',
    provenance: 'sneak-game-seed',
    provenanceNotes: [seedAssetNote],
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
