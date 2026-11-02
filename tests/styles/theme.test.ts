import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('theme.css accessibility styles', () => {
  it('defines pattern overlay classes and badge classes with pointer-events: none', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.region-pattern');
    expect(css).toContain('.pat-1');
    expect(css).toContain('.pat-8');
    expect(css).toContain('.region-glyph-badge');
    expect(css).toContain('.region-number-badge');
    expect(css).toContain('pointer-events: none');
  });

  it('Review Focus #4: enforces stacking order with patterns at z-index 1, cats/crosses at z-index 2, badges at z-index 3', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.region-pattern');
    expect(css).toMatch(/\.cross-mark\s*\{[^}]*z-index:\s*2/);
    expect(css).toMatch(/\.board-cat-wrapper\s*\{[^}]*z-index:\s*2/);
    expect(css).toMatch(/\.region-glyph-badge\s*\{[^}]*z-index:\s*3/);
    expect(css).toMatch(/\.region-number-badge\s*\{[^}]*z-index:\s*3/);
  });

  it('hides settings tab labels on mobile viewports up to 480px', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toMatch(/@media\s*\(\s*max-width:\s*480px\s*\)\s*\{[^}]*\.settings-tab-label\s*\{[^}]*display:\s*none/);
  });

  it('clips region patterns to cell rounded corners using border-radius: inherit', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toMatch(/\.region-pattern\s*\{[^}]*border-radius:\s*inherit/);
  });
});

describe('theme.css screen wipe and modal animation styles', () => {
  it('defines .screen-wipe-curtain with energetic coral #FF9770, fixed inset, z-index: 2000', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.screen-wipe-curtain');
    expect(css).toMatch(/\.screen-wipe-curtain\s*\{[^}]*z-index:\s*2000/);
    expect(css).toMatch(/\.screen-wipe-curtain\s*\{[^}]*#FF9770/i);
    expect(css).toMatch(/\.screen-wipe-curtain\s*\{[^}]*pointer-events:\s*none/);
  });

  it('defines .screen-transition-shield at z-index: 1999', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.screen-transition-shield');
    expect(css).toMatch(/\.screen-transition-shield\s*\{[^}]*z-index:\s*1999/);
  });

  it('defines .modal-backdrop-anim and .modal-card-flyin with cubic-bezier(0.16, 1, 0.3, 1)', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.modal-backdrop-anim');
    expect(css).toContain('.modal-card-flyin');
    expect(css).toContain('cubic-bezier(0.16, 1, 0.3, 1)');
  });
});

describe('theme.css Milestone 2 game juice and victory celebration styles', () => {
  it('defines per-cat confetti, 3rd-star behind-star confetti with z-index: 1 and forwards fill, heart-losing, and score-float-pop classes', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.board-cell-victory-glow');
    expect(css).toContain('.cat-confetti-piece');
    expect(css).toContain('.star3-confetti-piece');
    expect(css).toMatch(/\.star3-confetti-piece\s*\{[^}]*z-index:\s*1/);
    expect(css).toMatch(/\.star3-confetti-piece\s*\{[^}]*opacity:\s*0/);
    expect(css).toContain('.heart-losing');
    expect(css).toContain('.score-float-pop');
  });
});

