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
});
