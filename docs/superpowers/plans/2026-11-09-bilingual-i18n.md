# Milestone 7 — Bilingual i18n (Spanish / English) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Milestone 7: complete bilingual localization (Spanish and English) for KittySquared with automatic device language detection, manual override in the Settings "Controles" tab, zero runtime dependencies, and 100% zero-emoji audit compliance.

**Architecture:**
- Layered translation engine: `types.ts` -> `translations.ts` -> `translator.ts` -> `context.tsx` -> `index.ts`.
- Preact Context `<I18nProvider>` with `useI18n()` hook, defaulting to `lang: 'es'` and `t: createTranslator('es')` so existing tests and un-wrapped components remain 100% backward-compatible.
- Persisted `language: 'auto' | 'es' | 'en'` in `AppSettings`.
- Document metadata synchronization (`document.documentElement.lang` and `document.title`).
- Localized cat breed names, interactive tutorial steps, daily dates, share summaries, and error/dialog copy.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-11-09-bilingual-i18n-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-09-bilingual-i18n-design.md)

---

## Global Constraints & Commitments
1. **Zero-Emoji Audit & CI Hardening:** Every `.ts`, `.tsx`, and `.css` file in `src/` must strictly pass the zero-emoji audit in `tests/components/Icons.test.tsx`. Never place country flag emojis (e.g. 🇪🇸 or 🇬🇧) or any forbidden Unicode symbols in source files; use clean text (`Auto`, `Español`, `English`). Regional indicator symbols `\u{1F1E6}-\u{1F1FF}` are banned.
2. **Backward Compatibility & Default Context:** The default value of `I18nContext` must use `createTranslator('es')` so un-wrapped components seamlessly render Spanish by default without breaking existing component tests.
3. **Score & Star Isolation:** Language changes never affect game progress, level stars, scores, or daily streaks.
4. **Clickable Links:** All references to files and symbols in responses must use markdown links with `file://` scheme.

---

## Tasks

### Task 1: Core i18n Engine, Dictionaries & Zero-Emoji CI Hardening
**Files to create/modify:**
- `tests/components/Icons.test.tsx`
- `src/types/puzzle.ts`
- `src/i18n/types.ts` (create)
- `src/i18n/translations.ts` (create)
- `src/i18n/translator.ts` (create)
- `src/i18n/context.tsx` (create)
- `src/i18n/index.ts` (create)
- `tests/i18n/translations.test.ts` (create)
- `tests/i18n/index.test.ts` (create)

- [ ] **Step 1.1:** Update `forbiddenEmojiRegex` in `tests/components/Icons.test.tsx` to include `\u{1F1E6}-\u{1F1FF}` (regional indicator flag symbols) and add an explicit test asserting that flag emojis (🇪🇸, 🇬🇧) trigger the regex.
- [ ] **Step 1.2:** Run `npx vitest run tests/components/Icons.test.tsx` to verify passing.
- [ ] **Step 1.3:** Add `Language = 'auto' | 'es' | 'en'` and `EffectiveLanguage = 'es' | 'en'` to `src/types/puzzle.ts`.
- [ ] **Step 1.4:** Define `TranslationSchema`, `AssistOptionCopy`, and `TutorialStepCopy` in `src/i18n/types.ts` (including `levels.tierBanner`, `levels.frontierPlay`, `game.restartTooltip`, and `step-1` to `step-9` for tutorial steps).
- [ ] **Step 1.5:** Write failing unit tests in `tests/i18n/translations.test.ts` (deep recursive key parity between `es` and `en`, no empty strings, valid interpolation tokens) and `tests/i18n/index.test.ts` (`resolveEffectiveLanguage`, `createTranslator`, `getLocalizedBreedName`, and default Spanish context fallback).
- [ ] **Step 1.6:** Run `npx vitest run tests/i18n/` and confirm failure (RED).
- [ ] **Step 1.7:** Implement `src/i18n/translations.ts` containing complete `es` and `en` dictionaries.
- [ ] **Step 1.8:** Implement `src/i18n/translator.ts` (`resolveEffectiveLanguage`, `createTranslator`, `getLocalizedBreedName`), `src/i18n/context.tsx` (`<I18nProvider>`, `useI18n` with default Spanish translator fallback), and `src/i18n/index.ts` (barrel exports).
- [ ] **Step 1.9:** Run `npx vitest run tests/i18n/ tests/components/Icons.test.tsx` and confirm passing (GREEN).
- [ ] **Step 1.10:** Commit with message `feat: add core i18n engine, bilingual dictionaries, and zero-emoji flag hardening`.

---

### Task 2: Storage Sanitization & Date / Share Localization
**Files to create/modify:**
- `tests/state/storage.test.ts`
- `src/state/storage.ts`
- `tests/engine/daily.test.ts`
- `src/engine/daily.ts`
- `tests/engine/share.test.ts`
- `src/engine/share.ts`

- [ ] **Step 2.1 (Storage TDD):**
  - Write failing tests in `tests/state/storage.test.ts` testing `loadPersistedState()` defaults `settings.language` to `'auto'`, sanitizes invalid strings to `'auto'`, and `resetProgress()` preserves `settings.language`.
  - Run `npx vitest run tests/state/storage.test.ts` and confirm failure (RED).
  - Update `AppSettings` in `src/state/storage.ts` with `language: Language`, update `DEFAULT_APP_SETTINGS`, update sanitization in `loadPersistedState()`, and update `resetProgress()`.
  - Run `npx vitest run tests/state/storage.test.ts` and confirm passing (GREEN).
- [ ] **Step 2.2 (Daily Date TDD):**
  - Write failing tests in `tests/engine/daily.test.ts` testing `formatDailyDate(dateStr, style, lang)` renders Spanish ("8 de noviembre" / "8 nov 2026") and English ("November 8" / "Nov 8, 2026").
  - Run `npx vitest run tests/engine/daily.test.ts` and confirm failure (RED).
  - Update `src/engine/daily.ts` to export `formatDailyDate` accepting optional `lang?: EffectiveLanguage` (defaulting to `'es'`).
  - Run `npx vitest run tests/engine/daily.test.ts` and confirm passing (GREEN).
- [ ] **Step 2.3 (Share Summary TDD):**
  - Write failing tests in `tests/engine/share.test.ts` testing `formatDailyShareText` with `lang: 'es' | 'en'` producing localized headers, singular/plural mistakes ("0 mistakes", "1 mistake", "2 mistakes"), and streaks ("1 day", "5 days").
  - Run `npx vitest run tests/engine/share.test.ts` and confirm failure (RED).
  - Update `src/engine/share.ts` with `lang?: EffectiveLanguage` option and localized templates.
  - Run `npx vitest run tests/engine/share.test.ts` and confirm passing (GREEN).
- [ ] **Step 2.4:** Commit with message `feat: add language setting persistence and localized dates and share summaries`.

---

### Task 3: SettingsModal Language Selector in "Controles" Tab & Settings Localization
**Files to create/modify:**
- `tests/components/SettingsModal.test.tsx`
- `src/components/SettingsModal.tsx`

- [ ] **Step 3.1:** Write failing tests in `tests/components/SettingsModal.test.tsx`:
  - In the "Controles" tab, a segmented language selector is rendered at the top with options `[ Auto | Español | English ]` (`data-testid="language-select"`).
  - Tapping `English` or `Español` fires `onUpdateSettings({ language: ... })`.
  - All tab headers ("Controls", "Graphics", "Audio", "Assists"), slider descriptions, double-tap tester strings, breed gallery names (`getLocalizedBreedName`), audio tracks, and assist option labels/descriptions render in English when active language is `'en'`.
- [ ] **Step 3.2:** Run `npx vitest run tests/components/SettingsModal.test.tsx` and confirm failure (RED).
- [ ] **Step 3.3:** Update `src/components/SettingsModal.tsx`:
  - Consume `useI18n()` for translations.
  - Render the segmented language selector in the Controles tab as the top section.
  - Localize all tab headers, double-tap tester copy, breed gallery names (`getLocalizedBreedName`), audio tracks, assist labels/descriptions, and danger zone reset copy.
- [ ] **Step 3.4:** Run `npx vitest run tests/components/SettingsModal.test.tsx tests/components/Icons.test.tsx` and confirm passing (GREEN).
- [ ] **Step 3.5:** Commit with message `feat: add language selector in Settings Controles tab and localize settings modal`.

---

### Task 4: HomeScreen, LevelSelectScreen, PostGameModal & ConfirmDialog Localization
**Files to create/modify:**
- `tests/components/HomeScreen.test.tsx`
- `src/components/HomeScreen.tsx`
- `tests/components/LevelSelectScreen.test.tsx`
- `src/components/LevelSelectScreen.tsx`
- `tests/components/PostGameModal.test.tsx`
- `src/components/PostGameModal.tsx`
- `tests/components/ConfirmDialog.test.tsx` (create)
- `src/components/ConfirmDialog.tsx`

- [ ] **Step 4.1:** Write failing tests in `tests/components/HomeScreen.test.tsx`, `tests/components/LevelSelectScreen.test.tsx`, `tests/components/PostGameModal.test.tsx`, and `tests/components/ConfirmDialog.test.tsx` verifying UI elements in English when active language is `'en'`.
- [ ] **Step 4.2:** Run the tests and confirm failure (RED).
- [ ] **Step 4.3:** Localize `src/components/HomeScreen.tsx` (play button, levels button, Reto Diario card, score, reset button, and confirmation dialog).
- [ ] **Step 4.4:** Localize `src/components/LevelSelectScreen.tsx` (title, star count, back button, tier banner, frontier play text, tile aria labels).
- [ ] **Step 4.5:** Localize `src/components/PostGameModal.tsx` (completion summary, replay buttons, reset button, and close button).
- [ ] **Step 4.6:** Localize `src/components/ConfirmDialog.tsx` using `useI18n()` for default button fallbacks (`t('common.confirm')` and `t('common.cancel')`).
- [ ] **Step 4.7:** Run `npx vitest run tests/components/HomeScreen.test.tsx tests/components/LevelSelectScreen.test.tsx tests/components/PostGameModal.test.tsx tests/components/ConfirmDialog.test.tsx` and confirm passing (GREEN).
- [ ] **Step 4.8:** Commit with message `feat: localize HomeScreen, LevelSelectScreen, PostGameModal, and ConfirmDialog`.

---

### Task 5: GameScreen & TutorialModal Interactive Localization
**Files to create/modify:**
- `tests/components/GameScreen.test.tsx`
- `src/components/GameScreen.tsx`
- `tests/components/TutorialModal.test.tsx`
- `src/components/TutorialModal.tsx`
- `src/data/tutorialSteps.ts`

- [ ] **Step 5.1:** Write failing tests in `tests/components/GameScreen.test.tsx` asserting:
  - Header displays "Daily Challenge" or "Level {id}" in English.
  - Legend displays "1 tap: ✕ Cross • 2 taps: Cat".
  - Victory Modal displays "Level Completed!", score breakdown, unlocked breed banner ("New kitten unlocked!"), and buttons in English.
  - Defeat modal and restart dialog display English copy.
  - Share text and toast notification display English copy.
- [ ] **Step 5.2:** Write failing tests in `tests/components/TutorialModal.test.tsx` asserting:
  - Tutorial tabs ("1. Rules & Controls", "2. Strategies"), step counters, step titles, step explanations, step hints, and completion buttons render in English when active language is `'en'`.
- [ ] **Step 5.3:** Run the tests and confirm failure (RED).
- [ ] **Step 5.4:** Localize `src/components/GameScreen.tsx`.
- [ ] **Step 5.5:** Localize `src/components/TutorialModal.tsx` and adapt tutorial step text lookup from translation catalog (falling back to `tutorialSteps.ts`).
- [ ] **Step 5.6:** Run `npx vitest run tests/components/GameScreen.test.tsx tests/components/TutorialModal.test.tsx tests/components/Icons.test.tsx` and confirm passing (GREEN).
- [ ] **Step 5.7:** Commit with message `feat: localize GameScreen, Victory/Defeat modals, and interactive TutorialModal`.

---

### Task 6: App Root Integration, Document Metadata & Full Verification
**Files to create/modify:**
- `tests/App.test.tsx`
- `src/App.tsx`

- [ ] **Step 6.1:** Write failing tests in `tests/App.test.tsx` verifying:
  - `<I18nProvider>` wraps the application.
  - Changing language in Settings immediately updates texts across all active screens.
  - `document.documentElement.lang` and `document.title` are updated to match the effective language.
  - Existing tests in `tests/App.test.tsx` continue passing by ensuring Spanish is tested when `settings.language = 'es'` or testing default locale.
- [ ] **Step 6.2:** Run `npx vitest run tests/App.test.tsx` and confirm failure (RED).
- [ ] **Step 6.3:** Update `src/App.tsx` with `<I18nProvider>` and document metadata effect.
- [ ] **Step 6.4:** Run `npx tsc --noEmit && npx vitest run` across the entire test suite and confirm passing (GREEN).
- [ ] **Step 6.5:** Build production bundle via `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npm run build`.
- [ ] **Step 6.6:** Commit with message `feat: integrate i18n provider and document metadata synchronization in App`.
- [ ] **Step 6.7:** Verify live rendering at `http://localhost:5173/`.
