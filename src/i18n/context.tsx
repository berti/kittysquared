import { createContext, type ComponentChildren } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import type { EffectiveLanguage, Language } from '../types/puzzle';
import { createTranslator } from './translator';

export interface I18nContextValue {
  lang: EffectiveLanguage;
  setting: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage?: (language: Language) => void;
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setting: 'auto',
  t: createTranslator('es'),
});

export interface I18nProviderProps {
  lang?: EffectiveLanguage;
  setting?: Language;
  onSetLanguage?: (language: Language) => void;
  children: ComponentChildren;
}

export function I18nProvider({
  lang = 'es',
  setting = 'auto',
  onSetLanguage,
  children,
}: I18nProviderProps) {
  const t = useMemo(() => createTranslator(lang), [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setting,
      t,
      setLanguage: onSetLanguage,
    }),
    [lang, setting, t, onSetLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
