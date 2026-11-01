import { GameMode } from '../types/puzzle';

export interface DebugRouteParams {
  isDebug: true;
  mode: GameMode;
  levelId: number;
}

export function parseDebugRoute(pathname: string): DebugRouteParams | null {
  if (!pathname) return null;
  // Match /debug/... either at root or following a subpath (e.g. /kittysquared/debug/...)
  const match = pathname.match(/(?:^|\/)debug\/(classic|chill)\/(-?\d+)$/);
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

function getBasePrefix(): string {
  if (typeof window === 'undefined' || !window.location) return '';
  const pathname = window.location.pathname;
  const debugIndex = pathname.indexOf('/debug/');
  if (debugIndex > 0) {
    return pathname.slice(0, debugIndex);
  }
  return '';
}

export function updateDebugRoute(mode: GameMode, levelId: number): void {
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    const base = getBasePrefix();
    window.history.replaceState(null, '', `${base}/debug/${mode}/${levelId}`);
  }
}

export function clearDebugRoute(): void {
  if (typeof window !== 'undefined' && window.history?.pushState) {
    const base = getBasePrefix();
    window.history.pushState(null, '', base ? `${base}/` : '/');
  }
}
