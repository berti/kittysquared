import { EffectiveLanguage } from '../types/puzzle';

export interface DailyShareOptions {
  dateStr: string;
  stars: number;
  mistakes: number;
  timeSeconds: number;
  streak: number;
  url?: string;
  lang?: EffectiveLanguage;
}

export function formatDailyShareText({
  dateStr,
  stars,
  mistakes,
  timeSeconds,
  streak,
  url,
  lang = 'es',
}: DailyShareOptions): string {
  const starsStr = '\u2605'.repeat(Math.max(0, stars));
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = String(Math.floor(timeSeconds % 60)).padStart(2, '0');
  const timeStr = `${minutes}:${seconds}`;

  const isEn = lang === 'en';
  const titleLine = isEn
    ? `KittySquared \u2014 Daily Challenge ${dateStr}`
    : `KittySquared \u2014 Reto Diario ${dateStr}`;

  const mistakesStr = isEn
    ? (mistakes === 1 ? '1 mistake' : `${mistakes} mistakes`)
    : (mistakes === 1 ? '1 fallo' : `${mistakes} fallos`);

  const streakStr = isEn
    ? (streak === 1 ? 'Streak: 1 day' : `Streak: ${streak} days`)
    : (streak === 1 ? 'Racha: 1 d\u00eda' : `Racha: ${streak} d\u00edas`);

  const lines = [
    titleLine,
    `${starsStr} \u2022 ${mistakesStr} \u2022 ${timeStr}`,
    streakStr,
  ];

  const targetUrl = url === undefined ? 'https://kittysquared.game' : url;
  if (targetUrl) {
    lines.push(targetUrl);
  }

  return lines.join('\n');
}

export async function shareDailyResult(
  text: string,
  lang: EffectiveLanguage = 'es'
): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: lang === 'en' ? 'KittySquared Daily Challenge' : 'KittySquared Reto Diario',
        text,
      });
      return 'shared';
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
