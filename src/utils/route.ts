import { GameMode } from '../types/puzzle';

export interface DebugRouteParams {
  isDebug: true;
  mode: GameMode;
  levelId: number;
}

export function parseDebugRoute(pathname: string): DebugRouteParams | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/debug\/(classic|chill)\/(-?\d+)$/);
  if (!match) return null;

  const mode = match[1] as GameMode;
  const parsedLevel = parseInt(match[2], 10);
  if (Number.isNaN(parsedLevel)) return null;

  const levelId = Math.min(300, Math.max(1, parsedLevel));

  return {
    isDebug: true,
    mode,
    levelId,
  };
}

export function updateDebugRoute(mode: GameMode, levelId: number): void {
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    window.history.replaceState(null, '', `/debug/${mode}/${levelId}`);
  }
}

export function clearDebugRoute(): void {
  if (typeof window !== 'undefined' && window.history?.pushState) {
    window.history.pushState(null, '', '/');
  }
}
