// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  I18nContext,
  I18nProvider,
  createTranslator,
  getLocalizedBreedName,
  resolveEffectiveLanguage,
  useI18n,
  type I18nContextValue,
} from '../../src/i18n';
import type { CatVariant } from '../../src/types/puzzle';

describe('i18n Engine & Context (src/i18n)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  describe('resolveEffectiveLanguage', () => {
    it('resolves auto based on navigator language (en variants to en, others to es)', () => {
      expect(resolveEffectiveLanguage('auto', 'en-US')).toBe('en');
      expect(resolveEffectiveLanguage('auto', 'en-GB')).toBe('en');
      expect(resolveEffectiveLanguage('auto', 'en')).toBe('en');
      expect(resolveEffectiveLanguage('auto', 'EN-CA')).toBe('en');

      expect(resolveEffectiveLanguage('auto', 'es-ES')).toBe('es');
      expect(resolveEffectiveLanguage('auto', 'es-MX')).toBe('es');
      expect(resolveEffectiveLanguage('auto', 'es')).toBe('es');

      // Non-English / non-Spanish locales default to Spanish
      expect(resolveEffectiveLanguage('auto', 'fr-FR')).toBe('es');
      expect(resolveEffectiveLanguage('auto', 'de-DE')).toBe('es');
      expect(resolveEffectiveLanguage('auto', 'ja-JP')).toBe('es');
      expect(resolveEffectiveLanguage('auto', '')).toBe('es');
    });

    it('falls back to navigator.language when navLang is omitted', () => {
      const nav = typeof navigator !== 'undefined' ? navigator.language : '';
      const expected = nav.toLowerCase().startsWith('en') ? 'en' : 'es';
      expect(resolveEffectiveLanguage('auto')).toBe(expected);
    });

    it('respects explicit overrides regardless of navigator language', () => {
      expect(resolveEffectiveLanguage('es', 'en-US')).toBe('es');
      expect(resolveEffectiveLanguage('en', 'es-ES')).toBe('en');
      expect(resolveEffectiveLanguage('es', 'fr-FR')).toBe('es');
      expect(resolveEffectiveLanguage('en', 'fr-FR')).toBe('en');
    });
  });

  describe('getLocalizedBreedName', () => {
    const breeds: { id: CatVariant; es: string; en: string }[] = [
      { id: 'black', es: 'Gato Negro', en: 'Black Cat' },
      { id: 'white', es: 'Gato Blanco', en: 'White Cat' },
      { id: 'orange', es: 'Naranjito', en: 'Orange Tabby' },
      { id: 'siamese', es: 'Siamés', en: 'Siamese' },
      { id: 'calico', es: 'Calicó', en: 'Calico' },
      { id: 'tuxedo', es: 'Esmoquin', en: 'Tuxedo' },
      { id: 'russian', es: 'Azul Ruso', en: 'Russian Blue' },
      { id: 'sakura', es: 'Sakura Mochi', en: 'Sakura Mochi' },
    ];

    it('returns localized breed names in Spanish and English for all 8 breeds', () => {
      for (const breed of breeds) {
        expect(getLocalizedBreedName(breed.id, 'es')).toBe(breed.es);
        expect(getLocalizedBreedName(breed.id, 'en')).toBe(breed.en);
      }
    });

    it('falls back gracefully for unknown breed keys', () => {
      expect(getLocalizedBreedName('unknown_breed' as CatVariant, 'es')).toBe('unknown_breed');
      expect(getLocalizedBreedName('unknown_breed' as CatVariant, 'en')).toBe('unknown_breed');
    });
  });

  describe('I18nContext & useI18n hook', () => {
    function ConsumerComponent() {
      const { lang, setting, t } = useI18n();
      return (
        <div>
          <span data-testid="active-lang">{lang}</span>
          <span data-testid="active-setting">{setting}</span>
          <span data-testid="translated-play">{t('common.play')}</span>
          <span data-testid="translated-title">{t('common.gameTitle')}</span>
        </div>
      );
    }

    it('defaults to Spanish and a functional Spanish translator when rendered outside I18nProvider', () => {
      let consumerContextValue = {} as I18nContextValue;

      const { getByTestId } = render(
        <div>
          <ConsumerComponent />
          <I18nContext.Consumer>
            {(val) => {
              consumerContextValue = val;
              return null;
            }}
          </I18nContext.Consumer>
        </div>
      );

      expect(getByTestId('active-lang').textContent).toBe('es');
      expect(getByTestId('active-setting').textContent).toBe('auto');
      expect(getByTestId('translated-play').textContent).toBe('Jugar');
      expect(getByTestId('translated-title').textContent).toBe('KittySquared');

      // Direct verification of I18nContext default value via Consumer
      expect(consumerContextValue.lang).toBe('es');
      expect(consumerContextValue.setting).toBe('auto');
      expect(consumerContextValue.t('common.play')).toBe('Jugar');

      const standaloneTranslator = createTranslator('en');
      expect(standaloneTranslator('common.play')).toBe('Play');
    });

    it('provides configured English language and translation when wrapped in I18nProvider', () => {
      const { getByTestId } = render(
        <I18nProvider lang="en" setting="en">
          <ConsumerComponent />
        </I18nProvider>
      );

      expect(getByTestId('active-lang').textContent).toBe('en');
      expect(getByTestId('active-setting').textContent).toBe('en');
      expect(getByTestId('translated-play').textContent).toBe('Play');
    });

    it('passes setLanguage callback when provided to I18nProvider', () => {
      const onSetLanguage = vi.fn();

      function ButtonComponent() {
        const { setLanguage } = useI18n();
        return (
          <button
            type="button"
            data-testid="switch-btn"
            onClick={() => setLanguage?.('en')}
          >
            Switch
          </button>
        );
      }

      const { getByTestId } = render(
        <I18nProvider lang="es" setting="auto" onSetLanguage={onSetLanguage}>
          <ButtonComponent />
        </I18nProvider>
      );

      getByTestId('switch-btn').click();
      expect(onSetLanguage).toHaveBeenCalledWith('en');
    });
  });
});
