# Milestone 7 — Bilingual i18n (Spanish / English) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Milestone 7: complete bilingual localization (Spanish and English) for KittySquared with automatic device language detection, manual override in the Settings "Controles" tab, zero runtime dependencies, and 100% zero-emoji audit compliance.

**Architecture:**
- Zero-dependency type-safe dictionary catalog in `src/i18n/translations.ts` implementing `TranslationSchema`.
- Preact Context `<I18nProvider>` with `useI18n()` hook providing `{ t, lang, setting }`.
- Persisted `language: 'auto' | 'es' | 'en'` in `AppSettings`.
- Document metadata synchronization (`document.documentElement.lang` and `document.title`).
- Localized cat breed names, tutorial steps, daily dates, share summaries, and error/dialog copy.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-11-09-bilingual-i18n-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-09-bilingual-i18n-design.md)

---

## Global Constraints & Commitments
1. **Zero-Emoji Audit:** Every `.ts`, `.tsx`, and `.css` file in `src/` must strictly pass the zero-emoji audit in `tests/components/Icons.test.tsx`. Never place country flag emojis (e.g. 🇪🇸 or 🇬🇧) or any forbidden Unicode symbols in source files; use clean text (`Auto`, `Español`, `English`).
2. **Backward Compatibility:** Existing `localStorage` state without `settings.language` must sanitize cleanly to `'auto'`.
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
- `src/i18n/index.ts` (create)
- `src/i18n/context.tsx` (create)
- `tests/i18n/translations.test.ts` (create)
- `tests/i18n/index.test.ts` (create)

- [ ] **Step 1.1:** Update `forbiddenEmojiRegex` in `tests/components/Icons.test.tsx` to include `\u{1F1E6}-\u{1F1FF}` (regional indicator flag symbols) and verify it catches flag characters.
- [ ] **Step 1.2:** Add `Language = 'auto' | 'es' | 'en'` and `EffectiveLanguage = 'es' | 'en'` to `src/types/puzzle.ts`.
- [ ] **Step 1.3:** Write failing tests in `tests/i18n/translations.test.ts` and `tests/i18n/index.test.ts`:
  - Deep key parity between `es` and `en` (every key in `es` exists in `en` with non-empty string).
  - Parameter interpolation in `createTranslator()` (e.g. `{id}`, `{count}`, `{stars}`).
  - Fallback behavior (missing key falls back to key path).
  - `resolveEffectiveLanguage()` resolves `'auto'` to `'en'` if `navigator.language` starts with `'en'`, otherwise `'es'`, and honors explicit overrides `'es'` and `'en'`.
  - `getLocalizedBreedName()` returns localized breed names in both languages.
- [ ] **Step 1.4:** Define `TranslationSchema`, `AssistOptionCopy`, and `TutorialStepCopy` in `src/i18n/types.ts`.
- [ ] **Step 1.5:** Implement `src/i18n/translations.ts` containing complete `es` and `en` dictionaries.
- [ ] **Step 1.6:** Implement `src/i18n/index.ts` (`resolveEffectiveLanguage`, `createTranslator`, `getLocalizedBreedName`) and `src/i18n/context.tsx` (`<I18nProvider>`, `useI18n`).
- [ ] **Step 1.7:** Run `npx vitest run tests/i18n/ tests/components/Icons.test.tsx` and verify passing.
- [ ] **Step 1.8:** Commit with message `feat: add core i18n engine, bilingual dictionaries, and zero-emoji flag hardening`.

---

### Task 2: Storage Sanitization & Date / Share Localization
**Files to create/modify:**
- `src/state/storage.ts`
- `tests/state/storage.test.ts`
- `src/engine/daily.ts`
- `tests/engine/daily.test.ts`
- `src/engine/share.ts`
- `tests/engine/share.test.ts`

- [ ] **Step 2.1:** Write failing tests in `tests/state/storage.test.ts`:
  - `loadPersistedState()` on legacy state without `settings.language` initializes `language: 'auto'`.
  - `loadPersistedState()` sanitizes invalid language values to `'auto'`.
  - `resetProgress()` preserves `settings.language` intact.
- [ ] **Step 2.2:** Update `AppSettings` in `src/state/storage.ts` with `language: Language`, update `DEFAULT_APP_SETTINGS`, sanitize `language` in `loadPersistedState()`, and preserve in `resetProgress()`.
- [ ] **Step 2.3:** Write failing tests in `tests/engine/daily.test.ts` verifying `formatDailyDate(dateStr, style, lang)` renders Spanish and English months ("8 de noviembre" / "November 8", "8 nov 2026" / "Nov 8, 2026").
- [ ] **Step 2.4:** Update `src/engine/daily.ts` to export `formatDailyDate` accepting optional `lang?: EffectiveLanguage` (defaulting to `'es'`).
- [ ] **Step 2.5:** Write failing tests in `tests/engine/share.test.ts` verifying `formatDailyShareText` with `lang: 'es' | 'en'` produces proper titles, singular/plural mistakes ("0 mistakes", "1 mistake", "2 mistakes"), and streaks ("1 day", "5 days").
- [ ] **Step 2.6:** Update `src/engine/share.ts` with `lang?: EffectiveLanguage` option and localized templates.
- [ ] **Step 2.7:** Run `npx vitest run tests/state/storage.test.ts tests/engine/daily.test.ts tests/engine/share.test.ts` and verify passing.
- [ ] **Step 2.8:** Commit with message `feat: add language setting persistence and localized dates and share summaries`.

---

### Task 3: SettingsModal Language Selector in "Controles" Tab & Settings Localization
**Files to create/modify:**
- `tests/components/SettingsModal.test.tsx`
- `src/components/SettingsModal.tsx`

- [ ] **Step 3.1:** Write failing tests in `tests/components/SettingsModal.test.tsx`:
  - In the "Controles" tab, a language selector is rendered at the top with options `[ Auto | Español | English ]` (`data-testid="language-select"`).
  - Tapping `English` or `Español` fires `onUpdateSettings({ language: ... })`.
  - All tab labels ("Controls", "Graphics", "Audio", "Assists"), slider descriptions, breed cards, audio options, and assist descriptions render in the active language.
- [ ] **Step 3.2:** Update `src/components/SettingsModal.tsx` to consume `useI18n()` (or accept `lang: EffectiveLanguage`):
  - Render the segmented language selector in the Controles tab.
  - Localize all tab headers, double-tap tester strings, breed gallery names (`getLocalizedBreedName`), audio tracks, assist labels/descriptions, and danger zone reset copy.
- [ ] **Step 3.3:** Run `npx vitest run tests/components/SettingsModal.test.tsx tests/components/Icons.test.tsx` and verify passing.
- [ ] **Step 3.4:** Commit with message `feat: add language selector in Settings Controles tab and localize settings modal`.

---

### Task 4: HomeScreen, LevelSelectScreen, PostGameModal & ConfirmDialog Localization
**Files to create/modify:**
- `tests/components/HomeScreen.test.tsx`
- `src/components/HomeScreen.tsx`
- `tests/components/LevelSelectScreen.test.tsx`
- `src/components/LevelSelectScreen.tsx`
- `tests/components/PostGameModal.test.tsx`
- `src/components/PostGameModal.tsx`
- `src/components/ConfirmDialog.tsx`

- [ ] **Step 4.1:** Write failing tests in `tests/components/HomeScreen.test.tsx`, `tests/components/LevelSelectScreen.test.tsx`, and `tests/components/PostGameModal.test.tsx` verifying UI elements in English when active language is `'en'`.
- [ ] **Step 4.2:** Localize `src/components/HomeScreen.tsx` (buttons, level counter, Reto Diario card, reset progress dialog).
- [ ] **Step 4.3:** Localize `src/components/LevelSelectScreen.tsx` (title, star count, back button, tile aria labels).
- [ ] **Step 4.4:** Localize `src/components/PostGameModal.tsx` and `src/components/ConfirmDialog.tsx`.
- [ ] **Step 4.5:** Run `npx vitest run tests/components/HomeScreen.test.tsx tests/components/LevelSelectScreen.test.tsx tests/components/PostGameModal.test.tsx` and verify passing.
- [ ] **Step 4.6:** Commit with message `feat: localize HomeScreen, LevelSelectScreen, PostGameModal, and ConfirmDialog`.

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
- [ ] **Step 5.3:** Localize `src/components/GameScreen.tsx`.
- [ ] **Step 5.4:** Localize `src/components/TutorialModal.tsx` and adapt tutorial step text lookup from translation catalog.
- [ ] **Step 5.5:** Run `npx vitest run tests/components/GameScreen.test.tsx tests/components/TutorialModal.test.tsx tests/components/Icons.test.tsx` and verify passing.
- [ ] **Step 5.6:** Commit with message `feat: localize GameScreen, Victory/Defeat modals, and interactive TutorialModal`.

---

### Task 6: App Root Integration, Document Metadata & Full Verification
**Files to create/modify:**
- `tests/App.test.tsx`
- `src/App.tsx`

- [ ] **Step 6.1:** Write failing tests in `tests/App.test.tsx` verifying:
  - `<I18nProvider>` wraps the application.
  - Changing language in Settings immediately updates texts across all active screens.
  - `document.documentElement.lang` and `document.title` are updated to match the effective language.
- [ ] **Step 6.2:** Update `src/App.tsx` with `<I18nProvider>` and document metadata effect.
- [ ] **Step 6.3:** Run `npx tsc --noEmit && npx vitest run` across the entire test suite.
- [ ] **Step 6.4:** Build production bundle via `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npm run build`.
- [ ] **Step 6.5:** Commit with message `feat: integrate i18n provider and document metadata synchronization in App`.
- [ ] **Step 6.6:** Verify live rendering at `http://localhost:5173/`.
