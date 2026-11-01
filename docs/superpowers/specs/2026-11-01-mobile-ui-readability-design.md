# Design Doc: Mobile UI Readability and Layout Improvements

## Intent and Why
Improve readability and touch usability on mobile phones by removing visual noise and redundant helper text, increasing core font sizes and icon dimensions, and streamlining navigation button layouts across Home, Settings, and Game screens.

## Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - **HomeScreen:**
    - Remove the redundant subtitle text *"300 puzzles de lógica felina"*.
    - Simplify navigation buttons: remove emojis (`🎮`, `📖`, `⚙️`).
    - Unify the Play card into a single coral button (`#FF9770`) with no nested button inside, placing the level and points right-aligned.
    - Reorganize *"Tutorial"* and *"Ajustes"* into full-width stacked buttons placed underneath the Play button.
  - **SettingsModal:**
    - Increase font sizes by at least +2pt across all modal sections and tabs.
    - Double-tap speed section: remove the milliseconds indicator (`XXXms`) under the slider, keeping only clear descriptive labels ("Rápido", "Medio", "Lento"), and remove the *"ÁREA DE PRUEBA"* title.
    - Region visual assist section: remove micro-descriptions inside the selection buttons (retaining clean, larger titles: "Desactivado", "Rayas", "Gatitos 🐾", "Números 1-9"), and remove the caption *"Muestra cómo lucen los gatos y las ayudas de región juntos"*.
  - **GameScreen:**
    - Increase header button and navigation text sizes by +2pt.
    - Significantly enlarge icons and typography in the status bar (cats count, hearts/lives, points) to 16.5px+ with 20px+ emojis.
    - Increase the bottom gesture control hint text to 14.5px.
  - **Testing:**
    - Update all affected component tests to match the new text content and layouts, ensuring 100% test pass rate.
- **Non-Goals:**
  - Redesigning the core Board or cell SVG rendering logic.
  - Changing game state, scoring mechanics, or puzzle generation.
- **Anti-Goals:**
  - Breaking touch event handlers, modal transitions, or existing test suites.

## Approaches Considered
- **Approach A: Direct inline styles consistent with current codebase (Selected)**
  - Follow the existing convention of component-level inline styles using project color tokens.
  - Directly update `HomeScreen.tsx`, `SettingsModal.tsx`, and `GameScreen.tsx`, followed by updating assertions in corresponding test files.
  - *Tradeoffs:* Cleanest, lowest risk, matches the existing code pattern across all components.
- **Approach B: Extract classes to `theme.css` (Rejected)**
  - Move the modified buttons and bars into new CSS classes in `src/styles/theme.css`.
  - *Tradeoffs:* Diverges from the inline style pattern used throughout other components and increases scope without functional benefit.

## Detailed Architecture & Decisions

### 1. Home Screen (`src/components/HomeScreen.tsx`)
- Remove `<p style={{ margin: 0, fontSize: '14px', color: '#8C7A80' }}>300 puzzles de lógica felina</p>`.
- Replace the outer card + inner "Jugar ▶" button with a single clickable element:
  - Background: `#FF9770`, border: `2px solid #E07A5F`, box-shadow: `0 4px 0 #D9724C`, border-radius: `16px`, padding: `18px 20px`.
  - Left side: "Jugar" (font-size: `20px`, font-weight: `900`, color: `#FFF`).
  - Right side: `Nivel {progress.currentLevelId} / 300 • {progress.totalScore} pts` (font-size: `14.5px`, font-weight: `700`, color: `#FFFBF2`).
- Restructure Tutorial and Ajustes buttons container:
  - Change container to `flexDirection: 'column'`, `gap: '12px'`, `width: '100%'`.
  - Tutorial button: text "Tutorial" (no emoji), width `100%`, padding `14px 16px`, font-size `15.5px`.
  - Ajustes button: text "Ajustes" (no emoji), width `100%`, padding `14px 16px`, font-size `15.5px`.

### 2. Settings Modal (`src/components/SettingsModal.tsx`)
- Font size scale bump (+2pt across sections):
  - Section headers: from `11px` to `13.5px` (font-weight: `900`).
  - Tab button labels: from `12px` to `13.5px`.
  - Slider values / category text: from `12px` to `14px`.
- Controls Tab:
  - Under slider labels: change `<span>Rápido (250ms)</span> <span>Medio (500ms)</span> <span>Lento (900ms)</span>` to `<span>Rápido</span> <span>Medio</span> <span>Lento</span>` with font-size `13px`.
  - Remove `<div style={{ fontSize: '11px', fontWeight: 800, ... }}>ÁREA DE PRUEBA</div>`.
  - Double tap tester feedback text: increase from `12px` to `13.5px`.
- Graphics Tab:
  - Cat variant selector: labels increased to `13.5px`.
  - Region visual assist buttons: remove the secondary `<span style={{ fontSize: '9.5px', ... }}>{item.desc}</span>`.
  - Label text inside assist buttons centered and increased to `13.5px` - `14px`.
  - Mini-board preview: remove the footer text `Muestra cómo lucen los gatos y las ayudas de región juntos`.
- Sound & Reset Tabs:
  - Button text and labels increased from `13px` to `15px`.

### 3. Game Screen (`src/components/GameScreen.tsx`)
- Top Bar:
  - "← Menú" button: font-size from `13px` to `15px`, padding `7px 14px`.
  - Level indicator: font-size from `17px` to `19px`.
  - Action buttons (`↺`, `⚙️`): font-size from `14px` to `16px`, padding `7px 11px`.
- Status Bar:
  - Container padding increased to `10px 16px`, border-radius `16px`, border `2px solid #E2D6C1`.
  - Text font-size increased from `13.5px` to `16.5px`, font-weight `900`.
  - Emojis/icons enlarged to `20px` (`🐱`), `19px` (`❤️`), `19px` (`⭐`).
- Controls Hint:
  - Gesture text increased from `12.5px` to `14.5px`, font-weight `700`.
- Modals (Victory / Defeat):
  - Title font-size from `22px` to `24px`.
  - Body text from `14px` to `15.5px`.
  - Action buttons from `15px` to `16.5px`.

### 4. Test Updates
- `tests/components/HomeScreen.test.tsx`:
  - Update queries looking for `📖 Tutorial`, `⚙️ Ajustes`, `🎮 Jugar`, or `300 puzzles de lógica felina`.
- `tests/components/SettingsModal.test.tsx`:
  - Update queries checking for "ÁREA DE PRUEBA" or button subdescriptions if present.
- `tests/components/GameScreen.test.tsx`:
  - Ensure any status bar or menu text queries continue to match.
