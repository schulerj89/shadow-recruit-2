import titleTrackUrl from '../assets/title-on-patrol.ogg?url';
import gameplayTrackUrl from '../assets/ghost-steps.mp3?url';
import loadingTrackUrl from '../assets/future-loading-loop.wav?url';
import completionTrackUrl from '../assets/dark-sci-fi-urgent.mp3?url';
import type { GameSettings } from './types';

type TrackId = 'title' | 'loading' | 'gameplay' | 'complete';

const tracks: Record<TrackId, string> = {
  title: titleTrackUrl,
  loading: loadingTrackUrl,
  gameplay: gameplayTrackUrl,
  complete: completionTrackUrl,
};

export class AudioDirector {
  private readonly elements = new Map<TrackId, HTMLAudioElement>();
  private activeTrack: TrackId | null = null;
  private unlocked = false;

  constructor(private settings: GameSettings) {}

  unlock(): void {
    this.unlocked = true;
    if (this.activeTrack) void this.play(this.activeTrack);
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    for (const element of this.elements.values()) {
      element.muted = settings.muted;
      element.volume = settings.muted ? 0 : 0.52;
    }
  }

  async play(track: TrackId): Promise<void> {
    this.activeTrack = track;
    for (const [id, element] of this.elements) {
      if (id !== track) {
        element.pause();
        element.currentTime = 0;
      }
    }

    const element = this.element(track);
    element.muted = this.settings.muted;
    element.volume = track === 'complete' ? 0.64 : 0.5;
    element.loop = track !== 'complete';

    if (!this.unlocked) return;

    try {
      await element.play();
    } catch {
      // Browser autoplay policy can still block. User gestures call unlock again.
    }
  }

  stop(): void {
    for (const element of this.elements.values()) {
      element.pause();
      element.currentTime = 0;
    }
    this.activeTrack = null;
  }

  snapshot(): { activeTrack: TrackId | null; muted: boolean; unlocked: boolean } {
    return {
      activeTrack: this.activeTrack,
      muted: this.settings.muted,
      unlocked: this.unlocked,
    };
  }

  private element(track: TrackId): HTMLAudioElement {
    let element = this.elements.get(track);
    if (!element) {
      element = new Audio(tracks[track]);
      element.preload = 'auto';
      element.crossOrigin = 'anonymous';
      this.elements.set(track, element);
    }
    return element;
  }
}
