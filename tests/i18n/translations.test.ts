import { describe, expect, it } from 'vitest';
import { TRANSLATIONS } from '../../src/i18n/translations';
import { createTranslator } from '../../src/i18n/translator';

const FORBIDDEN_EMOJI_REGEX =
  /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{2714}\u{2716}-\u{27BF}\u{2B50}\u{21BA}]/u;

function flattenKeysAndValues(obj: unknown, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof obj !== 'object' || obj === null) {
    return result;
  }
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') {
      result[fullKey] = val;
    } else if (typeof val === 'object' && val !== null) {
      Object.assign(result, flattenKeysAndValues(val, fullKey));
    }
  }
  return result;
}

function extractPlaceholders(str: string): string[] {
  const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, '')).sort();
}

describe('Translation Dictionaries (src/i18n/translations.ts)', () => {
  it('has identical keys in Spanish (es) and English (en)', () => {
    const esFlat = flattenKeysAndValues(TRANSLATIONS.es);
    const enFlat = flattenKeysAndValues(TRANSLATIONS.en);

    const esKeys = Object.keys(esFlat).sort();
    const enKeys = Object.keys(enFlat).sort();

    expect(esKeys).toEqual(enKeys);
    expect(esKeys.length).toBeGreaterThan(40);
  });

  it('contains no empty strings in either dictionary', () => {
    const esFlat = flattenKeysAndValues(TRANSLATIONS.es);
    const enFlat = flattenKeysAndValues(TRANSLATIONS.en);

    for (const [key, val] of Object.entries(esFlat)) {
      expect(val.trim().length, `Empty Spanish key: ${key}`).toBeGreaterThan(0);
    }
    for (const [key, val] of Object.entries(enFlat)) {
      expect(val.trim().length, `Empty English key: ${key}`).toBeGreaterThan(0);
    }
  });

  it('strictly complies with the Zero-Emoji and flag ban audit in all translations', () => {
    const esFlat = flattenKeysAndValues(TRANSLATIONS.es);
    const enFlat = flattenKeysAndValues(TRANSLATIONS.en);

    for (const [key, val] of Object.entries(esFlat)) {
      expect(
        FORBIDDEN_EMOJI_REGEX.test(val),
        `Forbidden emoji or flag detected in Spanish [${key}]: "${val}"`
      ).toBe(false);
    }
    for (const [key, val] of Object.entries(enFlat)) {
      expect(
        FORBIDDEN_EMOJI_REGEX.test(val),
        `Forbidden emoji or flag detected in English [${key}]: "${val}"`
      ).toBe(false);
    }
  });

  it('matches interpolation parameter placeholders between es and en', () => {
    const esFlat = flattenKeysAndValues(TRANSLATIONS.es);
    const enFlat = flattenKeysAndValues(TRANSLATIONS.en);

    for (const [key, esVal] of Object.entries(esFlat)) {
      const enVal = enFlat[key];
      const esParams = extractPlaceholders(esVal);
      const enParams = extractPlaceholders(enVal);
      expect(
        enParams,
        `Placeholder mismatch for key "${key}": es=${JSON.stringify(esParams)}, en=${JSON.stringify(enParams)}`
      ).toEqual(esParams);
    }
  });

  it('interpolates parameters correctly with createTranslator', () => {
    const tEs = createTranslator('es');
    const tEn = createTranslator('en');

    expect(tEs('levels.totalStars', { stars: 12, max: 900 })).toBe('Estrellas: 12 / 900');
    expect(tEn('levels.totalStars', { stars: 12, max: 900 })).toBe('Stars: 12 / 900');

    expect(tEs('common.levelN', { id: 42 })).toBe('Nivel 42');
    expect(tEn('common.levelN', { id: 42 })).toBe('Level 42');

    expect(tEs('home.streakDays', { count: 7 })).toBe('7 días');
    expect(tEn('home.streakDays', { count: 7 })).toBe('7 days');
  });

  it('returns key itself when key is not found in dictionary', () => {
    const t = createTranslator('es');
    expect(t('nonexistent.nested.key')).toBe('nonexistent.nested.key');
  });

  it('includes cats tab translation in Spanish and English', () => {
    expect((TRANSLATIONS.es.settings.tabs as unknown as Record<string, string>).cats).toBe('Gatos');
    expect((TRANSLATIONS.en.settings.tabs as unknown as Record<string, string>).cats).toBe('Cats');
  });
});
