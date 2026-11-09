import type { CatVariant, EffectiveLanguage, Language } from '../types/puzzle';
import { TRANSLATIONS } from './translations';

export function resolveEffectiveLanguage(
  setting: Language,
  navLang?: string
): EffectiveLanguage {
  if (setting === 'es') return 'es';
  if (setting === 'en') return 'en';

  const locale =
    navLang !== undefined
      ? navLang
      : typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : '';

  if (locale.trim().toLowerCase().startsWith('en')) {
    return 'en';
  }

  return 'es';
}

export function createTranslator(lang: EffectiveLanguage) {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.es;

  return function t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.');
    let curr: unknown = dict;

    for (const part of parts) {
      if (typeof curr === 'object' && curr !== null && part in curr) {
        curr = (curr as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }

    if (typeof curr !== 'string') {
      return key;
    }

    if (!params) {
      return curr;
    }

    return curr.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramKey: string) => {
      if (paramKey in params) {
        return String(params[paramKey]);
      }
      return match;
    });
  };
}

export function getLocalizedBreedName(variant: CatVariant, lang: EffectiveLanguage): string {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.es;
  return dict.settings.breeds[variant] ?? variant;
}
