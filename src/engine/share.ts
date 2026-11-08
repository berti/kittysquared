export interface DailyShareOptions {
  dateStr: string;
  stars: number;
  mistakes: number;
  timeSeconds: number;
  streak: number;
  url?: string;
}

export function formatDailyShareText({
  dateStr,
  stars,
  mistakes,
  timeSeconds,
  streak,
  url,
}: DailyShareOptions): string {
  const starsStr = '\u2605'.repeat(Math.max(0, stars));
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = String(Math.floor(timeSeconds % 60)).padStart(2, '0');
  const timeStr = `${minutes}:${seconds}`;

  const lines = [
    `KittySquared \u2014 Reto Diario ${dateStr}`,
    `${starsStr} \u2022 ${mistakes} fallos \u2022 ${timeStr}`,
    `Racha: ${streak} d\u00edas`,
  ];

  const targetUrl = url === undefined ? 'https://kittysquared.game' : url;
  if (targetUrl) {
    lines.push(targetUrl);
  }

  return lines.join('\n');
}

export async function shareDailyResult(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'KittySquared Reto Diario',
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
