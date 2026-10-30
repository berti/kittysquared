# KittySquared — Colorblind Accessibility & Region Assist Design

**Date:** 2026-10-30  
**Work Size:** Small change (Feature addition to Settings & Board rendering)

---

## 1. Intent & Purpose (The "Why")

In KittySquared (a Queens / Star Battle logic puzzle game), distinguishing 4 to 9 discrete regions is a core mechanic. Because any 9-hue color palette inevitably collapses under color vision deficiencies (Deuteranopia, Protanopia, Tritanopia, and Achromatopsia/monochromacy), color alone is insufficient for accessible play ([WCAG 2.1 Guideline 1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)).

The goal is to empower color-blind and visually impaired players with redundant non-color visual encoding options in the Settings modal, catering to player preferences between geometric textures, thematic mascots, and numbers.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Add an accessible **Region Assist** setting with 4 choices:
  - `off`: Default clean solid palette.
  - `textures`: 9 distinct repeating geometric SVG/CSS patterns (stripes, dots, grid, waves, etc.) at calibrated subtle opacity (~22%) so cats and crosses stay crisp.
  - `glyphs`: 9 cozy mascot icons in the cell corners (🐾 Paw, 🐟 Fish, 🧶 Yarn, 🔔 Bell, ⭐ Star, 🌙 Moon, 🐭 Mouse, 👑 Crown, 💖 Heart).
  - `numbers`: Subtle corner numbers `1` through `9`.
- Persist player selection in `localStorage` alongside existing settings.
- Ensure the selected visual cue works seamlessly across all board sizes (5×5 through 9×9), in both **Chill Out** and **Classic** modes, and in the Tutorial.
- Verify full legibility against both **Black Cat** and **White Cat** variants and normal/error cross marks.

### Non-Goals
- Replacing the existing warm color palette with an aggressive high-contrast-only theme by default.
- Redesigning the core puzzle generator or rules logic (purely a visual/presentation layer change).

### Anti-Goals
- Visual clutter: Pattern textures or icons must never obscure or compete with placed cats or cross marks.
- Performance regressions: Pattern overlays and glyphs must render with lightweight pure CSS and SVG without dropped frames or pointer lag during dragging.

---

## 3. Technical Constraints

- **Stack:** Preact, TypeScript, Vite, CSS custom properties.
- **Persistence:** Saved in `localStorage` under KittySquared settings schema.
- **Responsiveness:** Badges and textures must scale proportionally across mobile viewports and desktop resolutions.

---

## 4. Approaches Considered & Trade-offs

1. **Approach A: Fixed Single Alternative (Textures only or Glyphs only)**
   - *Trade-off:* Imposes one aesthetic style on all color-blind players. While textures are traditional, some players find patterns visually busy and prefer corner symbols or numbers.
2. **Approach B: Color-Only Palette Swap (Okabe-Ito / Tol)**
   - *Trade-off:* Mathematically fails under complete monochromacy (Achromatopsia) because 9 regions cannot maintain sufficient distinct luminance steps without dark tiles clashing with black cats/crosses.
3. **Approach C (Chosen): Multi-option "Region Assist" Setting (`off` | `textures` | `glyphs` | `numbers`)**
   - *Trade-off:* Gives players the choice of their preferred accessibility mode without compromising the default clean look. Easy to implement via CSS classes and lightweight corner elements.

---

## 5. Implementation Specifications

### 5.1 Settings Model & Persistence
In `src/types/puzzle.ts` or settings type:
```ts
export type RegionAssistMode = 'off' | 'textures' | 'glyphs' | 'numbers';
```
Included in game settings state and persisted to `localStorage` (default: `'off'`).

### 5.2 Board Rendering (`src/components/Board.tsx`)
Inside each cell:
- If `regionAssist === 'textures'`: Render `<div class="region-pattern pat-{regId % 9}" />`.
- If `regionAssist === 'glyphs'`: Render `<span class="region-glyph-badge">{GLYPHS[regId % 9]}</span>`.
- If `regionAssist === 'numbers'`: Render `<span class="region-number-badge">{(regId % 9) + 1}</span>`.
- If `regionAssist === 'off'`: No additional element rendered.

All overlays have `pointer-events: none` to preserve seamless drag and tap interactions.

### 5.3 Styles (`src/styles/theme.css`)
- Reusable CSS classes for the 9 pattern overlays with tuned opacity (`0.22`) and blend modes.
- Reusable badge styles positioned neatly at `top: 2px; left: 3px; font-size: 11px;` with subtle drop shadow for legibility over light and dark region colors.

### 5.4 Settings Modal UI (`src/components/SettingsModal.tsx`)
Add a new segmented/radio group:
- **Region Assist:** Off | Textures | Kitty Glyphs | Numbers
With concise descriptive sublabels for each option.
