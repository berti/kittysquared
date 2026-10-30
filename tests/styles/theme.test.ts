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
});
