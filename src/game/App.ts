import * as THREE from 'three';
import emblemUrl from '../assets/generated/shadow-recruit-emblem.png?url';
import generalUrl from '../assets/generated/general-caldwell.png?url';
import doorPanelUrl from '../assets/generated/sliding-door-panel.png?url';
import { AssetLibrary, type CharacterInstance, disposeObject } from './CharacterAssets';
import { AudioDirector } from './AudioDirector';
import { defaultHeroId, heroOptionById, heroOptions, isHeroId, type HeroId } from './heroes';
import { defaultLevel, getLevelById, levelCatalog } from './levels';
import { add, clamp, distance, normalize, pointInBounds, pointInRect, scale, subtract } from './math';
import { loadSettings, saveSettings } from './settings';
import type {
  DoorRuntime,
  EnemyRuntime,
  FramePacingSample,
  GameSettings,
  LevelCatalogEntry,
  LevelDefinition,
  MemoryMetrics,
  ObjectiveRuntime,
  Phase,
  RectSpec,
  RendererMetrics,
  TesterState,
  Vec2,
} from './types';

type DoorMesh = {
  left: THREE.Object3D;
  right: THREE.Object3D;
};

type RuntimeObject = {
  object: THREE.Object3D;
  dispose?: () => void;
  disposeResources?: boolean;
};

type ShadowRecruitDebugApi = {
  ready: () => boolean;
  phase: () => Phase;
  missionId: () => string;
  missions: () => readonly LevelCatalogEntry[];
  selectedHero: () => HeroId;
  playerPosition: () => Vec2;
  playerVisible: () => boolean;
  enemies: () => readonly { id: string; position: Vec2 }[];
  objectives: () => { collectedRequired: number; totalRequired: number; exitUnlocked: boolean };
  doors: () => readonly { id: string; open: boolean; progress: number }[];
  rendererMetrics: () => RendererMetrics;
  framePacing: () => FramePacingSample;
  memoryMetrics: () => MemoryMetrics;
  selectMission: (missionId: string) => Promise<void>;
  movePlayerTo: (point: Vec2) => void;
  collectObjective: (objectiveId: string) => void;
  forceAlert: () => void;
  forceFailure: () => void;
  forceSuccess: () => void;
  resetMission: () => Promise<void>;
  startGame: (heroId?: string) => Promise<void>;
  completeMission: () => void;
  resetFramePacing: () => void;
  captureTesterState: () => TesterState;
};

declare global {
  interface Window {
    __shadowRecruitDebug?: ShadowRecruitDebugApi;
  }
}

export class ShadowRecruitApp {
  private readonly shell: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLDivElement;
  private readonly hud: HTMLDivElement;
  private readonly prompt: HTMLDivElement;
  private readonly debugPanel: HTMLDivElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 240);
  private readonly clock = new THREE.Clock();
  private readonly assets = new AssetLibrary();
  private readonly keyState = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly frameDeltas: number[] = [];
  private readonly runtimeObjects: RuntimeObject[] = [];
  private readonly doorMeshes = new Map<string, DoorMesh>();
  private readonly anchorObjects = new Map<string, THREE.Object3D>();
  private readonly doorTexture = new THREE.TextureLoader().load(doorPanelUrl);
  private level: LevelDefinition = defaultLevel;
  private settings: GameSettings = loadSettings();
  private readonly audio = new AudioDirector(this.settings);
  private selectedHero: HeroId = defaultHeroId;
  private phase: Phase = 'boot';
  private previousPhase: Phase = 'title';
  private ready = false;
  private loading = { label: 'booting', value: 0 };
  private objectives: ObjectiveRuntime[] = [];
  private doors: DoorRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private player: CharacterInstance | null = null;
  private titleHero: CharacterInstance | null = null;
  private playerPosition: Vec2 = { ...defaultLevel.start };
  private runStartedAt = 0;
  private alarms = 0;
  private tutorialIndex = 0;
  private activePrompt = '';
  private focusUntil = 0;

  constructor(private readonly host: HTMLDivElement) {
    this.shell = document.createElement('div');
    this.shell.className = 'game-shell';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';

    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    this.overlay.dataset.testid = 'overlay';

    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.hud.dataset.testid = 'hud';

    this.prompt = document.createElement('div');
    this.prompt.className = 'interaction-prompt';
    this.prompt.dataset.testid = 'interaction-prompt';
    this.prompt.hidden = true;

    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    this.debugPanel.dataset.testid = 'debug-panel';
    this.debugPanel.hidden = true;

    this.shell.append(this.canvas, this.overlay, this.hud, this.prompt, this.debugPanel);
    this.host.append(this.shell);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setClearColor(0x04070b);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setAnimationLoop((time) => this.frame(time));
    this.doorTexture.colorSpace = THREE.SRGBColorSpace;
    this.doorTexture.anisotropy = 4;

    this.installEvents();
    this.installDebugApi();
  }

  start(): void {
    this.resize();
    void this.boot();
  }

  private async boot(): Promise<void> {
    this.setPhase('loading');
    this.setLoading('loading title hero', 0.18);
    await this.assets.preloadHero(this.selectedHero);
    this.setLoading('building rotating level preview', 0.62);
    this.buildTitleScene();
    this.ready = true;
    this.setLoading('ready', 1);
    this.setPhase('title');
    await this.audio.play('title');
  }

  private buildTitleScene(): void {
    this.clearRuntime();
    this.createBaseScene();
    this.buildLevelShell(false);
    this.titleHero?.animator?.dispose();
    this.titleHero = this.assets.createHero(this.selectedHero, `title-hero:${this.selectedHero}`);
    this.titleHero.object.position.set(10, 0, -24);
    this.titleHero.object.rotation.y = -0.4;
    this.scene.add(this.titleHero.object);
    this.anchorObjects.set('hero', this.titleHero.object);
    this.camera.position.set(18, 17, -26);
    this.camera.lookAt(0, 0, 0);
  }

  private async startRun(heroId = this.selectedHero): Promise<void> {
    if (isHeroId(heroId)) this.selectedHero = heroId;
    this.audio.unlock();
    this.setPhase('loading');
    await this.audio.play('loading');
    this.setLoading('preloading hero, sentry, objectives', 0.18);
    await Promise.all([
      this.assets.preloadHero(this.selectedHero),
      this.assets.preloadSentry(),
      this.assets.preloadObjectives(),
    ]);
    this.setLoading(`building ${this.level.name.toLowerCase()}`, 0.68);
    this.buildPlayableLevel();
    this.setLoading('starting cinematic tutorial', 1);
    this.tutorialIndex = 0;
    this.setPhase('tutorial');
    this.focusTarget(this.level.tutorial[0].target);
    await this.audio.play('gameplay');
  }

  private buildPlayableLevel(): void {
    this.clearRuntime();
    this.createBaseScene();
    this.objectives = this.level.objectives.map((objective) => ({ ...objective, collected: false }));
    this.doors = this.level.doors.map((door) => ({ ...door, open: false, progress: 0 }));
    this.enemies = this.level.enemies.map((enemy) => ({
      ...enemy,
      position: { ...enemy.start },
      segment: 0,
      forward: normalize(subtract(enemy.patrol[1] ?? enemy.start, enemy.start)),
    }));
    this.playerPosition = { ...this.level.start };
    this.alarms = 0;
    this.runStartedAt = 0;

    this.buildLevelShell(true);
    this.createObjectives();
    this.createEnemies();
    this.createPlayer();
    this.createExtractionMarker();
    this.focusTarget('hero');
    this.renderHud();
  }

  private createBaseScene(): void {
    this.scene.background = new THREE.Color(0x04070b);
    this.scene.fog = new THREE.Fog(0x05080d, 32, 118);

    const ambient = new THREE.AmbientLight(0x8fb8c8, 1.1);
    const key = new THREE.DirectionalLight(0x9de8ff, 2.1);
    key.position.set(-12, 24, -10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const rim = new THREE.DirectionalLight(0xff5a65, 1.15);
    rim.position.set(18, 12, 22);
    this.scene.add(ambient, key, rim);
  }

  private buildLevelShell(includeDoors: boolean): void {
    const floorSizeX = this.level.bounds.max.x - this.level.bounds.min.x;
    const floorSizeZ = this.level.bounds.max.z - this.level.bounds.min.z;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSizeX, floorSizeZ, 24, 24),
      new THREE.MeshStandardMaterial({ color: '#111821', roughness: 0.78, metalness: 0.18 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'level-floor';
    this.scene.add(floor);
    this.runtimeObjects.push({ object: floor });

    for (const wall of this.level.walls) {
      this.addBox(wall, '#26323c', 0.18);
    }

    for (const blocker of this.level.blockers) {
      this.addBox(blocker, '#35404b', 0.1);
    }

    if (includeDoors) {
      for (const door of this.doors) {
        this.addDoor(door);
      }
    }

    this.addLightStrip(-36, -25, '#6fffe2');
    this.addLightStrip(34, -3, '#5ad7ff');
    this.addLightStrip(-32, 14, '#ffd45a');
    this.addLightStrip(0, 33, '#8eff81');
  }

  private addBox(rect: RectSpec, color: string, emissive = 0): THREE.Mesh {
    const height = rect.height ?? 1;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(rect.size.x, height, rect.size.z),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.68,
        metalness: 0.28,
        emissive: new THREE.Color(color).multiplyScalar(emissive),
      }),
    );
    mesh.position.set(rect.center.x, height / 2, rect.center.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = rect.id;
    this.scene.add(mesh);
    this.runtimeObjects.push({ object: mesh });
    this.anchorObjects.set(rect.id, mesh);
    return mesh;
  }

  private addDoor(door: DoorRuntime): void {
    const material = new THREE.MeshStandardMaterial({
      map: this.doorTexture,
      color: '#d5e2e8',
      roughness: 0.42,
      metalness: 0.56,
      emissive: new THREE.Color('#20343a'),
      emissiveIntensity: 0.18,
    });
    const height = door.height ?? 3.2;
    const panelSize = door.axis === 'x'
      ? new THREE.Vector3(door.size.x / 2, height, door.size.z)
      : new THREE.Vector3(door.size.x, height, door.size.z / 2);
    const left = new THREE.Mesh(new THREE.BoxGeometry(panelSize.x, panelSize.y, panelSize.z), material.clone());
    const right = new THREE.Mesh(new THREE.BoxGeometry(panelSize.x, panelSize.y, panelSize.z), material.clone());
    left.castShadow = true;
    right.castShadow = true;
    left.receiveShadow = true;
    right.receiveShadow = true;
    left.name = `${door.id}:left-panel`;
    right.name = `${door.id}:right-panel`;
    const group = new THREE.Group();
    group.name = door.id;
    group.add(left, right);
    this.scene.add(group);
    this.runtimeObjects.push({ object: group });
    this.doorMeshes.set(door.id, { left, right });
    this.anchorObjects.set(door.id, group);
    this.positionDoorMeshes(door);
  }

  private positionDoorMeshes(door: DoorRuntime): void {
    const mesh = this.doorMeshes.get(door.id);
    if (!mesh) return;

    const height = door.height ?? 3.2;
    const closedOffset = door.axis === 'x' ? door.size.x / 4 : door.size.z / 4;
    const slide = (door.axis === 'x' ? door.size.x : door.size.z) * 0.62 * door.progress;
    if (door.axis === 'x') {
      mesh.left.position.set(door.center.x - closedOffset - slide, height / 2, door.center.z);
      mesh.right.position.set(door.center.x + closedOffset + slide, height / 2, door.center.z);
    } else {
      mesh.left.position.set(door.center.x, height / 2, door.center.z - closedOffset - slide);
      mesh.right.position.set(door.center.x, height / 2, door.center.z + closedOffset + slide);
    }
  }

  private addLightStrip(x: number, z: number, color: string): void {
    const light = new THREE.PointLight(color, 2.8, 14);
    light.position.set(x, 2.6, z);
    this.scene.add(light);
    this.runtimeObjects.push({ object: light });
  }

  private createPlayer(): void {
    this.player = this.assets.createHero(this.selectedHero, `player:${this.selectedHero}`);
    this.player.object.position.set(this.playerPosition.x, 0, this.playerPosition.z);
    this.player.object.rotation.y = Math.PI;
    this.scene.add(this.player.object);
    this.anchorObjects.set('hero', this.player.object);
  }

  private createEnemies(): void {
    for (const enemy of this.enemies) {
      const instance = this.assets.createSentry(enemy.id);
      instance.object.position.set(enemy.position.x, 0, enemy.position.z);
      instance.object.rotation.y = Math.atan2(enemy.forward.x, enemy.forward.z);
      this.scene.add(instance.object);
      this.runtimeObjects.push({ object: instance.object, dispose: () => instance.animator?.dispose(), disposeResources: false });
      this.anchorObjects.set(enemy.id, instance.object);

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(enemy.detectionRadius, 0.04, 32),
        new THREE.MeshBasicMaterial({ color: '#ff5a65', transparent: true, opacity: 0.14, depthWrite: false }),
      );
      cone.rotation.x = -Math.PI / 2;
      cone.position.y = 0.03;
      instance.object.add(cone);
    }
  }

  private createObjectives(): void {
    for (const objective of this.objectives) {
      const object = this.assets.createObjective(objective.asset, objective.id);
      object.position.set(objective.position.x, 0, objective.position.z);
      object.rotation.y = objective.asset === 'terminal' ? -Math.PI / 2 : 0;
      this.scene.add(object);
      this.runtimeObjects.push({ object, disposeResources: false });
      this.anchorObjects.set(objective.id, object);
    }
  }

  private createExtractionMarker(): void {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.08, 10, 64),
      new THREE.MeshStandardMaterial({ color: '#8eff81', emissive: '#2c6b30', emissiveIntensity: 1.2 }),
    );
    ring.position.set(this.level.extraction.x, 0.08, this.level.extraction.z);
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'extraction';
    this.scene.add(ring);
    this.runtimeObjects.push({ object: ring });
    this.anchorObjects.set('extraction', ring);
  }

  private frame(timeMs: number): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.frameDeltas.push(delta * 1000);
    if (this.frameDeltas.length > 240) this.frameDeltas.shift();

    if (this.phase === 'title' || this.phase === 'hero-select' || this.phase === 'settings') {
      this.updateTitleCamera(timeMs / 1000);
    } else if (this.phase === 'playing') {
      this.updatePlaying(delta);
    } else if (this.phase === 'cinematic-focus' && performance.now() > this.focusUntil) {
      this.setPhase('playing');
    }

    this.updateDoors(delta);
    this.titleHero?.animator?.update(delta);
    this.player?.animator?.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.syncPrompt();
    this.updateDebugPanel();
    this.pressedKeys.clear();
  }

  private updateTitleCamera(time: number): void {
    const radius = 48;
    const angle = time * 0.12;
    this.camera.position.set(Math.cos(angle) * radius, 26, Math.sin(angle) * radius);
    this.camera.lookAt(0, 0, 0);
    if (this.titleHero) {
      this.titleHero.object.rotation.y = -angle + Math.PI * 0.75;
    }
  }

  private updatePlaying(delta: number): void {
    const movement = this.readMovement();
    const moving = movement.x !== 0 || movement.z !== 0;
    if (moving) {
      const speed = this.settings.performanceProfile === 'performance' ? 8.2 : 7.6;
      const next = add(this.playerPosition, scale(normalize(movement), speed * delta));
      if (this.canMoveTo(next)) {
        this.playerPosition = next;
      }
      if (this.player) {
        this.player.object.position.set(this.playerPosition.x, 0, this.playerPosition.z);
        this.player.object.rotation.y = Math.atan2(movement.x, movement.z);
        this.player.animator?.setMotionState('run');
      }
    } else {
      this.player?.animator?.setMotionState('idle');
    }

    this.updateEnemies(delta);
    this.updateGameplayCamera();
    this.updatePrompt();
    if (this.pressedKeys.has('KeyE')) this.tryInteract();
    this.checkExtraction();
  }

  private readMovement(): Vec2 {
    return {
      x: (this.keyState.has('KeyD') || this.keyState.has('ArrowRight') ? 1 : 0) -
        (this.keyState.has('KeyA') || this.keyState.has('ArrowLeft') ? 1 : 0),
      z: (this.keyState.has('KeyS') || this.keyState.has('ArrowDown') ? 1 : 0) -
        (this.keyState.has('KeyW') || this.keyState.has('ArrowUp') ? 1 : 0),
    };
  }

  private canMoveTo(point: Vec2): boolean {
    if (!pointInBounds(point, this.level.bounds, 0.55)) return false;
    const blockers: RectSpec[] = [
      ...this.level.walls,
      ...this.level.blockers,
      ...this.doors.filter((door) => !door.open).map((door) => door as RectSpec),
    ];
    return blockers.every((blocker) => !pointInRect(point, blocker, 0.42));
  }

  private updateEnemies(delta: number): void {
    for (const enemy of this.enemies) {
      const target = enemy.patrol[(enemy.segment + 1) % enemy.patrol.length] ?? enemy.start;
      const toTarget = subtract(target, enemy.position);
      const toTargetLength = Math.hypot(toTarget.x, toTarget.z);
      if (toTargetLength < 0.15) {
        enemy.segment = (enemy.segment + 1) % enemy.patrol.length;
      } else {
        const step = Math.min(enemy.speed * delta, toTargetLength);
        enemy.forward = normalize(toTarget);
        enemy.position = add(enemy.position, scale(enemy.forward, step));
      }

      const object = this.anchorObjects.get(enemy.id);
      if (object) {
        object.position.set(enemy.position.x, 0, enemy.position.z);
        object.rotation.y = Math.atan2(enemy.forward.x, enemy.forward.z);
      }

      if (distance(enemy.position, this.playerPosition) <= enemy.detectionRadius && this.phase === 'playing') {
        this.alarms += 1;
        this.activePrompt = '';
        this.setPhase('caught');
        this.activePrompt = 'Sentry contact. Operation failed.';
      }
    }
  }

  private updateDoors(delta: number): void {
    for (const door of this.doors) {
      const target = door.open ? 1 : 0;
      door.progress = clamp(door.progress + Math.sign(target - door.progress) * door.speed * delta, 0, 1);
      this.positionDoorMeshes(door);
    }
  }

  private updateGameplayCamera(): void {
    const target = new THREE.Vector3(this.playerPosition.x, 0.8, this.playerPosition.z);
    const desired = new THREE.Vector3(this.playerPosition.x + 8, 10, this.playerPosition.z + 12);
    this.camera.position.lerp(desired, 0.08);
    this.camera.lookAt(target);
  }

  private tryInteract(): void {
    const objective = this.objectives.find((item) => !item.collected && distance(item.position, this.playerPosition) <= item.radius);
    if (!objective) return;
    this.collectObjective(objective.id);
  }

  private collectObjective(objectiveId: string): void {
    const objective = this.objectives.find((item) => item.id === objectiveId);
    if (!objective || objective.collected) return;

    objective.collected = true;
    const object = this.anchorObjects.get(objective.id);
    object?.removeFromParent();
    this.activePrompt = `${objective.label} complete.`;

    for (const doorId of objective.unlocks) {
      const door = this.doors.find((candidate) => candidate.id === doorId);
      if (door && door.opensWhen.every((id) => this.objectives.find((item) => item.id === id)?.collected)) {
        door.open = true;
        this.pauseForDoorFocus(door.id);
      }
    }
    this.renderHud();
  }

  private pauseForDoorFocus(doorId: string): void {
    this.focusTarget(doorId);
    this.activePrompt = `Route updated: ${doorId.replaceAll('-', ' ')} is opening.`;
    this.focusUntil = performance.now() + 2200;
    this.setPhase('cinematic-focus');
  }

  private updatePrompt(): void {
    const objective = this.objectives.find((item) => !item.collected && distance(item.position, this.playerPosition) <= item.radius);
    if (objective) {
      this.activePrompt = `Press E: ${objective.label}`;
    } else if (this.getObjectiveProgress().exitUnlocked && distance(this.level.extraction, this.playerPosition) <= 3) {
      this.activePrompt = 'Extraction zone ready.';
    } else if (this.phase === 'playing') {
      this.activePrompt = '';
    }
  }

  private checkExtraction(): void {
    if (!this.getObjectiveProgress().exitUnlocked) return;
    if (distance(this.playerPosition, this.level.extraction) <= 2.7) {
      this.completeMission();
    }
  }

  private completeMission(): void {
    if (this.phase === 'complete') return;
    this.activePrompt = '';
    this.setPhase('complete');
    void this.audio.play('complete');
  }

  private focusTarget(targetId: string): void {
    const object = this.anchorObjects.get(targetId);
    const position = new THREE.Vector3();
    if (object) {
      object.getWorldPosition(position);
    } else if (targetId === 'extraction') {
      position.set(this.level.extraction.x, 0, this.level.extraction.z);
    } else {
      position.set(this.playerPosition.x, 0, this.playerPosition.z);
    }

    const angle = targetId === 'hero' ? -0.8 : 0.78;
    this.camera.position.set(position.x + Math.cos(angle) * 8, 6.4, position.z + Math.sin(angle) * 8);
    this.camera.lookAt(position.x, 0.8, position.z);
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    if (phase === 'playing' && this.runStartedAt === 0) {
      this.runStartedAt = performance.now();
    }
    this.renderOverlay();
    this.renderHud();
  }

  private setLoading(label: string, value: number): void {
    this.loading = { label, value };
    this.renderOverlay();
  }

  private openSettings(): void {
    this.previousPhase = this.phase === 'settings' ? this.previousPhase : this.phase;
    this.setPhase('settings');
  }

  private closeSettings(): void {
    this.setPhase(this.previousPhase);
  }

  private nextTutorial(): void {
    if (this.phase !== 'tutorial') return;
    this.tutorialIndex += 1;
    if (this.tutorialIndex >= this.level.tutorial.length) {
      this.setPhase('playing');
      this.runStartedAt = performance.now();
      return;
    }
    this.focusTarget(this.level.tutorial[this.tutorialIndex].target);
    this.renderOverlay();
  }

  private getObjectiveProgress(): { collectedRequired: number; totalRequired: number; exitUnlocked: boolean } {
    const required = this.objectives.filter((objective) => objective.required);
    const collected = required.filter((objective) => objective.collected);
    return {
      collectedRequired: collected.length,
      totalRequired: required.length,
      exitUnlocked: required.length > 0 && collected.length === required.length,
    };
  }

  private renderOverlay(): void {
    if (this.phase === 'title') {
      this.overlay.innerHTML = `
        <div class="title-layout" data-testid="title-panel">
          <section class="title-mark">
            <img class="title-emblem" src="${emblemUrl}" alt="" />
            <div class="title-kicker">Blacksite field program</div>
            <h1 class="title-logo">Shadow Recruit 2</h1>
            <p class="title-copy">Run the first infiltration, unlock the blacksite, avoid sentries, and extract before command loses the signal.</p>
          </section>
          <section class="command-panel">
            <div class="screen-kicker">Ready room</div>
            <h2 class="panel-title">Choose the mission posture.</h2>
            <p class="panel-copy">Level One rotates behind the title screen. Pick your recruit, configure debug and performance, then begin the tutorial insertion.</p>
            <div class="button-row is-stacked">
              <button type="button" data-action="start">Start</button>
              <button type="button" data-action="hero-select">Change Hero</button>
              <button type="button" data-action="settings">Settings</button>
            </div>
          </section>
        </div>`;
    } else if (this.phase === 'hero-select') {
      this.overlay.innerHTML = `
        <section class="screen-panel hero-select" data-testid="hero-select-panel">
          <div class="screen-kicker">Recruit roster</div>
          <h2>Select your operative</h2>
          <p>The selected GLB is used in the title preview, tutorial, and mission runtime.</p>
          <div class="hero-grid">
            ${heroOptions.map((hero) => `
              <button type="button" class="hero-card ${hero.id === this.selectedHero ? 'is-selected' : ''}" data-hero-id="${hero.id}">
                <strong>${hero.name}</strong>
                <span>${hero.role}</span>
                <small>${hero.description}</small>
              </button>
            `).join('')}
          </div>
          <div class="button-row">
            <button type="button" data-action="start-level">Start Level</button>
            <button type="button" data-action="back-title">Back</button>
          </div>
        </section>`;
    } else if (this.phase === 'settings') {
      this.overlay.innerHTML = `
        <section class="screen-panel settings-screen" data-testid="settings-panel">
          <div class="screen-kicker">Settings</div>
          <h2>Mission configuration</h2>
          <div class="settings-grid">
            <label class="setting-row">
              <span>Debug overlays</span>
              <input type="checkbox" data-setting="debug" ${this.settings.debug ? 'checked' : ''} />
            </label>
            <label class="setting-row">
              <span>Mute audio</span>
              <input type="checkbox" data-setting="muted" ${this.settings.muted ? 'checked' : ''} />
            </label>
            <label class="setting-row">
              <span>Performance profile</span>
              <select data-setting="performanceProfile">
                <option value="performance" ${this.settings.performanceProfile === 'performance' ? 'selected' : ''}>Performance</option>
                <option value="balanced" ${this.settings.performanceProfile === 'balanced' ? 'selected' : ''}>Balanced</option>
                <option value="cinematic" ${this.settings.performanceProfile === 'cinematic' ? 'selected' : ''}>Cinematic</option>
              </select>
            </label>
          </div>
          <div class="button-row">
            <button type="button" data-action="close-settings">Back</button>
          </div>
        </section>`;
    } else if (this.phase === 'loading') {
      this.overlay.innerHTML = `
        <section class="command-panel loading-panel" data-testid="loading-panel" style="--progress: ${(this.loading.value * 100).toFixed(0)}%">
          <div class="screen-kicker">Loading</div>
          <h2>${this.loading.label}</h2>
          <div class="loading-bar"><span></span></div>
        </section>`;
    } else if (this.phase === 'tutorial') {
      const step = this.level.tutorial[this.tutorialIndex];
      this.overlay.innerHTML = `
        <section class="briefing-panel" data-testid="tutorial-panel">
          <img class="general-portrait" src="${generalUrl}" alt="General Caldwell" />
          <div class="briefing-copy">
            <div class="screen-kicker">General Caldwell</div>
            <h2>${step.title}</h2>
            <p>${step.text}</p>
            <div class="button-row">
              <button type="button" data-action="next-tutorial">${this.tutorialIndex === this.level.tutorial.length - 1 ? 'Begin Mission' : 'Next'}</button>
              <button type="button" data-action="skip-tutorial">Skip</button>
            </div>
          </div>
        </section>`;
    } else if (this.phase === 'caught') {
      this.overlay.innerHTML = `
        <section class="complete-panel" data-testid="caught-panel">
          <div class="screen-kicker">Operation failed</div>
          <h2>Sentry contact</h2>
          <p>You were too close to a sentry. Reset the mission and use cover timing.</p>
          <div class="button-row">
            <button type="button" data-action="retry">Retry</button>
            <button type="button" data-action="back-title">Title</button>
          </div>
        </section>`;
    } else if (this.phase === 'complete') {
      const elapsed = this.runStartedAt ? Math.max(0, Math.round((performance.now() - this.runStartedAt) / 1000)) : 0;
      const progress = this.getObjectiveProgress();
      this.overlay.innerHTML = `
        <section class="complete-panel" data-testid="complete-panel">
          <div class="screen-kicker">Extraction complete</div>
          <h2>Blacksite Threshold cleared</h2>
          <p>Command confirms exfil. Triumphant extraction cue is live and the level stats are locked.</p>
          <div class="stats-grid">
            <div class="stat-card"><span>Time</span><strong>${elapsed}s</strong></div>
            <div class="stat-card"><span>Objectives</span><strong>${progress.collectedRequired}/${progress.totalRequired}</strong></div>
            <div class="stat-card"><span>Alerts</span><strong>${this.alarms}</strong></div>
            <div class="stat-card"><span>Profile</span><strong>${this.settings.performanceProfile}</strong></div>
          </div>
          <div class="button-row">
            <button type="button" data-action="retry">Replay Level</button>
            <button type="button" data-action="back-title">Title</button>
          </div>
        </section>`;
    } else {
      this.overlay.innerHTML = '';
    }
  }

  private renderHud(): void {
    if (this.phase !== 'playing' && this.phase !== 'cinematic-focus') {
      this.hud.innerHTML = '';
    } else {
      const progress = this.getObjectiveProgress();
      this.hud.innerHTML = `
        <section class="hud-panel">
          <div class="hud-kicker">${this.level.chapter}</div>
          <strong>${this.level.name}</strong>
          <div class="objective-list">
            ${this.objectives.map((objective) => `
              <span class="objective-chip ${objective.collected ? 'is-complete' : ''}">${objective.label}</span>
            `).join('')}
            <span class="objective-chip ${progress.exitUnlocked ? 'is-complete' : ''}">Extraction ${progress.exitUnlocked ? 'open' : 'locked'}</span>
          </div>
        </section>
        <nav class="hud-actions" aria-label="Mission controls">
          <button type="button" data-action="settings">Settings</button>
          <button type="button" data-action="toggle-mute">${this.settings.muted ? 'Unmute' : 'Mute'}</button>
          <button type="button" data-action="back-title">Title</button>
        </nav>`;
    }

    this.syncPrompt();
  }

  private syncPrompt(): void {
    this.prompt.hidden = !this.activePrompt;
    this.prompt.textContent = this.activePrompt;
  }

  private updateDebugPanel(): void {
    this.debugPanel.hidden = !this.settings.debug;
    if (this.debugPanel.hidden) return;
    const metrics = this.rendererMetrics();
    const pacing = this.framePacing();
    this.debugPanel.textContent = [
      `phase=${this.phase}`,
      `hero=${this.selectedHero}`,
      `pos=${this.playerPosition.x.toFixed(1)},${this.playerPosition.z.toFixed(1)}`,
      `fps=${pacing.fps.toFixed(1)} frame=${pacing.frameMs.toFixed(1)}ms p95=${pacing.p95FrameMs.toFixed(1)}ms`,
      `draw=${metrics.drawCalls} tri=${metrics.triangles}`,
      `geo=${metrics.geometries} tex=${metrics.textures}`,
      `doors=${this.doors.map((door) => `${door.id}:${door.progress.toFixed(1)}`).join(',')}`,
    ].join('\n');
  }

  private installEvents(): void {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (event) => {
      this.keyState.add(event.code);
      this.pressedKeys.add(event.code);
      if (event.code === 'Escape' && this.phase === 'settings') this.closeSettings();
    });
    window.addEventListener('keyup', (event) => this.keyState.delete(event.code));
    this.shell.addEventListener('pointerdown', () => this.audio.unlock());

    this.shell.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const heroButton = target.closest<HTMLElement>('[data-hero-id]');
      if (heroButton) {
        const heroId = heroButton.dataset.heroId;
        if (isHeroId(heroId)) void this.selectHero(heroId);
        return;
      }

      const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
      if (!action) return;
      void this.handleAction(action);
    });

    this.shell.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
      const setting = target.dataset.setting;
      if (!setting) return;
      if (setting === 'debug' && target instanceof HTMLInputElement) this.settings.debug = target.checked;
      if (setting === 'muted' && target instanceof HTMLInputElement) this.settings.muted = target.checked;
      if (setting === 'performanceProfile' && target instanceof HTMLSelectElement) {
        this.settings.performanceProfile = target.value === 'performance' || target.value === 'cinematic' ? target.value : 'balanced';
        this.applyPerformanceProfile();
      }
      saveSettings(this.settings);
      this.audio.updateSettings(this.settings);
      this.renderOverlay();
      this.renderHud();
    });
  }

  private async handleAction(action: string): Promise<void> {
    this.audio.unlock();
    if (action === 'start' || action === 'hero-select') {
      this.setPhase('hero-select');
    } else if (action === 'start-level') {
      await this.startRun();
    } else if (action === 'settings') {
      this.openSettings();
    } else if (action === 'close-settings') {
      this.closeSettings();
    } else if (action === 'back-title') {
      this.buildTitleScene();
      this.setPhase('title');
      await this.audio.play('title');
    } else if (action === 'next-tutorial') {
      this.nextTutorial();
    } else if (action === 'skip-tutorial') {
      this.setPhase('playing');
      this.runStartedAt = performance.now();
    } else if (action === 'retry') {
      await this.startRun();
    } else if (action === 'toggle-mute') {
      this.settings.muted = !this.settings.muted;
      saveSettings(this.settings);
      this.audio.updateSettings(this.settings);
      this.renderHud();
    }
  }

  private async selectHero(heroId: HeroId): Promise<void> {
    this.selectedHero = heroId;
    this.setLoading(`loading ${heroOptionById(heroId).name}`, 0.45);
    await this.assets.preloadHero(heroId);
    this.buildTitleScene();
    this.setPhase('hero-select');
  }

  private applyPerformanceProfile(): void {
    this.resize();
  }

  private resize(): void {
    const rect = this.shell.getBoundingClientRect();
    this.camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    this.camera.updateProjectionMatrix();
    const maxRatio = this.settings.performanceProfile === 'cinematic' ? 1.3 : this.settings.performanceProfile === 'balanced' ? 1 : 0.82;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
    this.renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  }

  private clearRuntime(): void {
    this.runtimeObjects.forEach((entry) => {
      entry.dispose?.();
      if (entry.disposeResources !== false) disposeObject(entry.object);
      entry.object.removeFromParent();
    });
    this.runtimeObjects.length = 0;
    this.doorMeshes.clear();
    this.anchorObjects.clear();
    this.objectives = [];
    this.doors = [];
    this.enemies = [];
    this.player?.animator?.dispose();
    this.player = null;
    this.titleHero?.animator?.dispose();
    this.titleHero = null;

    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      child.removeFromParent();
    }
  }

  private rendererMetrics(): RendererMetrics {
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      pixelRatio: this.renderer.getPixelRatio(),
    };
  }

  private memoryMetrics(): MemoryMetrics {
    return {
      runtimeObjects: this.runtimeObjects.length,
      ...this.assets.metrics(),
    };
  }

  private framePacing(): FramePacingSample {
    const samples = [...this.frameDeltas].sort((a, b) => a - b);
    const latest = this.frameDeltas[this.frameDeltas.length - 1] ?? 16.7;
    const median = samples[Math.floor(samples.length * 0.5)] ?? latest;
    const p95 = samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] ?? latest;
    return {
      fps: median > 0 ? 1000 / median : 0,
      frameMs: median,
      latestFrameMs: latest,
      p95FrameMs: p95,
      samples: this.frameDeltas.length,
    };
  }

  private async selectMission(missionId: string): Promise<void> {
    const level = getLevelById(missionId);
    if (!level) throw new Error(`Unknown mission: ${missionId}`);
    this.level = level;
    await this.startRun(this.selectedHero);
    this.setPhase('playing');
  }

  private movePlayerTo(point: Vec2): void {
    this.playerPosition = { ...point };
    if (this.player) this.player.object.position.set(point.x, 0, point.z);
    this.tryInteract();
    this.checkExtraction();
  }

  private forceAlert(): void {
    this.alarms += 1;
    this.setPhase('caught');
  }

  private captureTesterState(): TesterState {
    return {
      phase: this.phase,
      levelId: this.level.id,
      selectedHero: this.selectedHero,
      playerPosition: { ...this.playerPosition },
      objectives: this.getObjectiveProgress(),
      doors: this.doors.map((door) => ({ id: door.id, open: door.open, progress: door.progress })),
      renderer: this.rendererMetrics(),
      framePacing: this.framePacing(),
      memory: this.memoryMetrics(),
    };
  }

  private installDebugApi(): void {
    window.__shadowRecruitDebug = {
      ready: () => this.ready,
      phase: () => this.phase,
      missionId: () => this.level.id,
      missions: () => levelCatalog,
      selectedHero: () => this.selectedHero,
      playerPosition: () => ({ ...this.playerPosition }),
      playerVisible: () => Boolean(this.player?.object.visible ?? this.titleHero?.object.visible),
      enemies: () => this.enemies.map((enemy) => ({ id: enemy.id, position: { ...enemy.position } })),
      objectives: () => this.getObjectiveProgress(),
      doors: () => this.doors.map((door) => ({ id: door.id, open: door.open, progress: door.progress })),
      rendererMetrics: () => this.rendererMetrics(),
      framePacing: () => this.framePacing(),
      memoryMetrics: () => this.memoryMetrics(),
      selectMission: (missionId) => this.selectMission(missionId),
      movePlayerTo: (point) => this.movePlayerTo(point),
      collectObjective: (objectiveId) => this.collectObjective(objectiveId),
      forceAlert: () => this.forceAlert(),
      forceFailure: () => this.setPhase('caught'),
      forceSuccess: () => this.completeMission(),
      resetMission: () => this.startRun(this.selectedHero),
      startGame: (heroId) => this.startRun(isHeroId(heroId) ? heroId : this.selectedHero),
      completeMission: () => this.completeMission(),
      resetFramePacing: () => {
        this.frameDeltas.length = 0;
      },
      captureTesterState: () => this.captureTesterState(),
    };
  }
}
