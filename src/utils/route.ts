import { GameMode } from '../types/puzzle';

export interface DebugRouteParams {
  isDebug: true;
  mode: GameMode;
  levelId: number;
}

export function parseDebugRoute(pathOrUrl?: string): DebugRouteParams | null {
  const target =
    pathOrUrl ??
    (typeof window !== 'undefined' && window.location
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '');

  if (!target) return null;

  // Match debug route from pathname, hash, or query parameter
  // e.g. /debug/classic/84, #/debug/chill/12, #debug/classic/10, ?debug=classic/42, ?debug/chill/10
  const match = target.match(/(?:^|[/?#&])debug[=/](classic|chill)\/(-?\d+)(?:[/?#&]|$)/i);
  if (!match) return null;

  const mode = match[1].toLowerCase() as GameMode;
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
  if (debugIndex >= 0) {
    return pathname.slice(0, debugIndex);
  }
  if (pathname !== '/' && pathname.length > 0) {
    return pathname.replace(/\/$/, '');
  }
  return '';
}

export function updateDebugRoute(mode: GameMode, levelId: number): void {
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    const base = getBasePrefix();
    const isHash = window.location.hash.includes('debug');
    if (isHash) {
      window.history.replaceState(null, '', `${base ? base + '/' : ''}#/debug/${mode}/${levelId}`);
    } else {
      window.history.replaceState(null, '', `${base}/debug/${mode}/${levelId}`);
    }
  }
}

export function clearDebugRoute(): void {
  if (typeof window !== 'undefined' && window.history?.pushState) {
    const base = getBasePrefix();
    window.history.pushState(null, '', base ? `${base}/` : '/');
  }
}
