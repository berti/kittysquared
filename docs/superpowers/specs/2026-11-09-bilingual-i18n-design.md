# Milestone 7 — Bilingual i18n (Spanish / English) Design Spec

Date: 2026-11-09

## 1. Overview & Goals

Milestone 7 brings comprehensive bilingual localization (**Spanish** and **English**) to **KittySquared**.

### Core Objectives:
1. **Lightweight Typed Translation Engine (Zero-Dependency):**
   - Centralized dictionary catalog in [`src/i18n/translations.ts`](file:///home/berti/code/kittysquared/src/i18n/translations.ts) supporting `'es'` and `'en'` with 100% TypeScript compile-time type safety and interpolation helpers.
   - Preact Context (`<I18nProvider lang={effectiveLang}>`) with `useI18n()` hook returning `{ t, lang, setLanguage }` for clean, decoupled access across all screens and modals.
   - Zero runtime dependencies, keeping bundle additions under 4 KB gzipped.
2. **Device Locale Detection & Manual Override:**
   - Auto-detects device language from `navigator.language` (`en` if starting with `en`, fallback `es`).
   - Settings option in `settings.language` supporting `'auto' | 'es' | 'en'`.
3. **Settings Placement in "Controles" Tab:**
   - Prominent language selector segmented control (`[ Auto | Español | English ]`) located as the top section in the **Controles** tab of [`SettingsModal.tsx`](file:///home/berti/code/kittysquared/src/components/SettingsModal.tsx).
4. **Complete Coverage Across All Surfaces:**
   - Home Screen, Level Selector, Game Screen, Settings Modal, Tutorial Modal, PostGameModal, ConfirmDialog, and Daily Share summaries.
   - Localized Cat Breed names (e.g. "Gato Negro" / "Black Cat", "Naranjito" / "Orange Tabby", "Esmoquin" / "Tuxedo").
   - Localized Daily Challenge dates ("8 de noviembre" / "November 8").
   - Localized singular/plural handling for mistakes and streaks.
   - Synchronizes `document.documentElement.lang` (`'es'` or `'en'`) and document title for accessibility and SEO.
5. **Zero-Emoji Compliance & CI Defense:**
   - Strict adherence to the repository's zero-emoji audit: no flag emojis (e.g. 🇪🇸 or 🇬🇧); clean typography only (`Auto`, `Español`, `English`).
   - Regional Indicator Symbols (`\u{1F1E6}-\u{1F1FF}`) added to `forbiddenEmojiRegex` in `tests/components/Icons.test.tsx` to actively block flag emojis in CI.

---

## 2. Architecture & Data Model

### 2.1 Types (`src/types/puzzle.ts`)

```ts
export type Language = 'auto' | 'es' | 'en';
export type EffectiveLanguage = 'es' | 'en';
```

### 2.2 Storage Model (`src/state/storage.ts`)

Add `language: Language` to `AppSettings`:

```ts
export interface AppSettings {
  language: Language;
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  autoCross: AutoCrossMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
  musicVolume: SteppedVolume;
  sfxVolume: SteppedVolume;
  musicTrack: MusicTrackOption;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'auto',
  // ... other defaults
};
```

#### Sanitization:
In `loadPersistedState()`, validate `raw.settings.language`:
```ts
const VALID_LANGUAGES: readonly Language[] = ['auto', 'es', 'en'];
const language: Language = VALID_LANGUAGES.includes(cleanRawSettings.language)
  ? cleanRawSettings.language
  : 'auto';
```
When `resetProgress(state)` is called, `state.settings.language` is preserved intact.

---

## 3. Translation Engine (`src/i18n/`)

### 3.1 Preact Context & Hook (`src/i18n/context.tsx`)

```tsx
export interface I18nContextValue {
  lang: EffectiveLanguage;
  setting: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setting: 'auto',
  t: (key) => key,
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
```

### 3.2 Translation Schema (`src/i18n/types.ts`)

```ts
export interface AssistOptionCopy {
  label: string;
  desc: string;
}

export interface TutorialStepCopy {
  title: string;
  desc: string;
  hint: string;
}

export interface TranslationSchema {
  common: {
    gameTitle: string;
    play: string;
    levels: string;
    dailyChallenge: string;
    settings: string;
    howToPlay: string;
    back: string;
    close: string;
    retry: string;
    nextLevel: string;
    backToHome: string;
    share: string;
    equip: string;
    equipped: string;
    completed: string;
    gameCompleted: string;
    cancel: string;
    confirm: string;
    levelN: string; // "Nivel {id}" / "Level {id}"
  };
  home: {
    dailyHardBadge: string;
    streakDays: string; // "{count} días" / "{count} days"
    levelProgress: string; // "Nivel {current} / {total}"
    gameCompletedBanner: string;
    resetProgressBtn: string;
    confirmResetTitle: string;
    confirmResetMsg: string;
  };
  levels: {
    title: string;
    totalStars: string; // "Estrellas: {stars} / {max}"
    backToMenu: string;
    tileBlocked: string; // "Nivel {id}, bloqueado"
    tileCurrent: string; // "Nivel {id}, actual"
    tileStars: string; // "Nivel {id}, {stars} estrellas"
  };
  game: {
    dailyTitle: string;
    controlsLegend: string; // "1 toque: ✕ Cruz • 2 toques: Gato"
    mistakesZero: string;
    mistakesOne: string;
    mistakesCount: string; // "{count} fallos" / "{count} mistakes"
    levelCompleted: string;
    dailyCompleted: string;
    outOfLives: string;
    outOfLivesDesc: string;
    newKittenUnlocked: string;
    copiedToClipboard: string;
    timeLabel: string;
    scoreGains: {
      pointsGain: string; // "+{gain} pts"
      alreadyCompleted: string; // "+0 pts (ya completado)"
      recordImprovement: string; // "+{gain} pts (mejora de récord)"
      catPoints: string; // "Puntos gatos: +{score}"
      bonusStars: string; // "Bono {stars}★ ({mistakes}): +{bonus}"
      newTotal: string; // "Nuevo total: {total} pts"
      finalScore: string; // "Puntuación final: {total} pts"
    };
    confirmRestart: {
      title: string;
      desc: string;
      confirmBtn: string;
      cancelBtn: string;
    };
  };
  postGame: {
    title: string;
    summary: string;
    playLastBtn: string;
    playLastDesc: string;
    resetBtn: string;
    resetDesc: string;
    closeBtn: string;
  };
  settings: {
    title: string;
    tabs: {
      controls: string;
      graphics: string;
      audio: string;
      assists: string;
    };
    language: {
      sectionTitle: string;
      subtitle: string;
      auto: string;
      spanish: string;
      english: string;
    };
    controls: {
      doubleTapSection: string;
      sliderDesc: string;
      speedFast: string;
      speedNormal: string;
      speedSlow: string;
      testZoneTitle: string;
      testTapPrompt: string;
      doubleTapDetected: string;
      singleTapPrompt: string;
    };
    graphics: {
      sectionTitle: string;
      starsRequired: string; // "{stars}★ requeridas"
      unlocked: string;
      selected: string;
    };
    breeds: Record<CatVariant, string>;
    audio: {
      musicVolume: string;
      sfxVolume: string;
      musicTrack: string;
      tracks: {
        auto: string;
        marimba: string;
        velvet: string;
        sunbeam: string;
        bossa: string;
        waltz: string;
        samba: string;
      };
    };
    assists: {
      regionSection: string;
      regionOptions: {
        off: AssistOptionCopy;
        textures: AssistOptionCopy;
        glyphs: AssistOptionCopy;
        numbers: AssistOptionCopy;
      };
      autoCrossSection: string;
      autoCrossOptions: {
        off: AssistOptionCopy;
        row_col_surround: AssistOptionCopy;
        all: AssistOptionCopy;
      };
    };
  };
  tutorial: {
    title: string;
    tabs: {
      rules: string; // "1. Reglas y Controles" / "1. Rules & Controls"
      strategies: string; // "2. Estrategias" / "2. Strategies"
    };
    stepCounter: string; // "Paso {current} de {total}" / "Step {current} of {total}"
    successHint: string; // "¡Excelente! Deducción completada." / "Great! Deduction completed."
    nextBtn: string; // "Siguiente ▶" / "Next ▶"
    finishBtn: string; // "¡Listo para jugar! ▶" / "Ready to Play! ▶"
    steps: Record<string, TutorialStepCopy>; // keyed by stepId (step-1-1 through step-2-4)
  };
  share: {
    header: string; // "KittySquared — Reto Diario {date}" / "KittySquared — Daily Challenge {date}"
    streakDaysSingular: string; // "Racha: 1 día" / "Streak: 1 day"
    streakDaysPlural: string; // "Racha: {streak} días" / "Streak: {streak} days"
    dialogTitle: string; // "KittySquared Reto Diario" / "KittySquared Daily Challenge"
  };
}
```

### 3.3 Cat Breed Names Localization
| ID (`CatVariant`) | Spanish (`es`) | English (`en`) |
| :--- | :--- | :--- |
| `black` | Gato Negro | Black Cat |
| `white` | Gato Blanco | White Cat |
| `orange` | Naranjito | Orange Tabby |
| `siamese` | Siamés | Siamese |
| `calico` | Calicó | Calico |
| `tuxedo` | Esmoquin | Tuxedo |
| `russian` | Azul Ruso | Russian Blue |
| `sakura` | Sakura Mochi | Sakura Mochi |

Helper in `src/i18n/index.ts`:
```ts
export function getLocalizedBreedName(variant: CatVariant, lang: EffectiveLanguage): string {
  return TRANSLATIONS[lang].settings.breeds[variant] ?? variant;
}
```

### 3.4 Date & Share Localization
- **`formatDailyDate(dateStr, style, lang)`** in `src/engine/daily.ts`:
  - `lang === 'es'`:
    - `long`: `"8 de noviembre"`
    - `short`: `"8 nov 2026"`
  - `lang === 'en'`:
    - `long`: `"November 8"`
    - `short`: `"Nov 8, 2026"`
- **`formatDailyShareText(options)`** in `src/engine/share.ts`:
  - Supports `lang?: EffectiveLanguage` (defaults to `'es'`).
  - Singular/Plural mistakes:
    - `es`: `0 fallos`, `1 fallo`, `{n} fallos`.
    - `en`: `0 mistakes`, `1 mistake`, `{n} mistakes`.
  - Singular/Plural streaks:
    - `es`: `Racha: 1 día`, `Racha: {streak} días`.
    - `en`: `Streak: 1 day`, `Streak: {streak} days`.

---

## 4. UI Integration

### 4.1 SettingsModal Language Selector (`SettingsModal.tsx`)
In the **Controles** tab, placed as the first section before "VELOCIDAD DE DOBLE TOQUE":
- Header title: `"IDIOMA"` / `"LANGUAGE"`
- Subtitle: `"Detectar automáticamente o elegir idioma"` / `"Auto-detect or choose language"`
- Segmented 3-button control:
  - `[ Auto | Español | English ]`
  - Active button highlighted with primary theme pill (`#FF9770`, `#FFFFFF`).
  - Clicking updates `settings.language` and instantly re-renders the app in the chosen language.

### 4.2 Document & Meta Synchronization
In `src/App.tsx`, whenever `effectiveLang` updates:
- Set `document.documentElement.lang = effectiveLang`.
- Set `document.title` to:
  - `es`: `"KittySquared — Juego de Puzzles de Lógica"`
  - `en`: `"KittySquared — Logic Puzzle Game"`

### 4.3 Zero-Emoji CI Hardening
In `tests/components/Icons.test.tsx`, expand `forbiddenEmojiRegex` to include Regional Indicator Symbols:
```ts
const forbiddenEmojiRegex = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{2714}\u{2716}-\u{27BF}\u{2B50}\u{21BA}]/u;
```
This guarantees no country flag emojis can be added to source files.

---

## 5. Verification & Testing Strategy

1. **Translation Completeness & Key Parity (`tests/i18n/translations.test.ts`):**
   - Deep recursive key verification ensuring every key in `es` exists in `en` and vice-versa, with no empty strings or missing interpolations.
2. **Language Resolution & Storage Tests (`tests/state/storage.test.ts`, `tests/i18n/index.test.ts`):**
   - Verifies `resolveEffectiveLanguage('auto')` picks `en` for `en-US`, `en-GB`, and `es` for `es-ES`, `es-MX`, `fr-FR`.
   - Verifies explicit overrides `'es'` and `'en'`.
   - Verifies `loadPersistedState()` backwards compatibility defaults to `'auto'`.
   - Verifies `resetProgress()` preserves language choice.
3. **Component Localization Tests:**
   - `HomeScreen`: verified in both Spanish and English.
   - `LevelSelectScreen`: verified in both Spanish and English.
   - `GameScreen`: victory/defeat modal, restart dialog, legend, and headers in both languages.
   - `SettingsModal`: language toggle in Controles tab, translated tabs, breed gallery, and assist descriptions.
   - `TutorialModal`: interactive tutorial steps in both languages.
   - `PostGameModal`: completion summary and replay buttons in both languages.
   - `daily.test.ts` & `share.test.ts`: date formatting and share text verified in both languages with singular/plural variants.
4. **Zero-Emoji Audit (`tests/components/Icons.test.tsx`):**
   - 100% clean verification including the new regional flag emoji range.
