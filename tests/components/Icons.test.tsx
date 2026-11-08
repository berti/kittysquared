// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  AssistsTabIcon,
  CalendarIcon,
  CheckIcon,
  ControlsTabIcon,
  FlameIcon,
  GearIcon,
  GraphicsTabIcon,
  HeartSvg,
  MiniCatIcon,
  PawCoinIcon,
  REGION_GLYPH_IDS,
  RegionGlyphIcon,
  RestartIcon,
  SoundTabIcon,
  TapFingerIcon,
  WarningIcon,
} from '../../src/components/Icons';

describe('Soft-Clay SVG Icon Library (Icons.tsx)', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders core UI and tab SVG icons with expected test IDs and sizes', () => {
    const { getByTestId } = render(
      <div>
        <GearIcon size={24} />
        <RestartIcon size={22} />
        <MiniCatIcon size={20} />
        <PawCoinIcon size={18} testId="icon-paw-coin" />
        <WarningIcon size={26} />
        <ControlsTabIcon size={20} />
        <GraphicsTabIcon size={20} />
        <SoundTabIcon size={20} />
        <AssistsTabIcon size={20} />
        <TapFingerIcon size={28} />
      </div>
    );

    expect(getByTestId('icon-gear').getAttribute('width')).toBe('24');
    expect(getByTestId('icon-restart').getAttribute('width')).toBe('22');
    expect(getByTestId('icon-mini-cat').getAttribute('width')).toBe('20');
    expect(getByTestId('icon-paw-coin').getAttribute('width')).toBe('18');
    expect(getByTestId('icon-warning').getAttribute('width')).toBe('26');
    expect(getByTestId('icon-tab-controls')).toBeDefined();
    expect(getByTestId('icon-tab-graphics')).toBeDefined();
    expect(getByTestId('icon-tab-sound')).toBeDefined();
    expect(getByTestId('icon-tab-ayudas')).toBeDefined();
    expect(getByTestId('icon-tap-prompt')).toBeDefined();
  });

  it('renders bespoke daily and streak icons (FlameIcon, CalendarIcon, CheckIcon)', () => {
    const { getByTestId } = render(
      <div>
        <FlameIcon size={22} testId="icon-flame" />
        <CalendarIcon size={24} testId="icon-calendar" />
        <CheckIcon size={18} testId="icon-check" />
      </div>
    );

    const flame = getByTestId('icon-flame');
    expect(flame.tagName.toLowerCase()).toBe('svg');
    expect(flame.getAttribute('width')).toBe('22');

    const calendar = getByTestId('icon-calendar');
    expect(calendar.tagName.toLowerCase()).toBe('svg');
    expect(calendar.getAttribute('width')).toBe('24');

    const check = getByTestId('icon-check');
    expect(check.tagName.toLowerCase()).toBe('svg');
    expect(check.getAttribute('width')).toBe('18');
  });

  it('renders HeartSvg in full, empty, and heart-losing states', () => {
    const { getByTestId } = render(
      <div>
        <HeartSvg isLost={false} testId="heart-full" />
        <HeartSvg isLost={true} testId="heart-empty" />
        <HeartSvg isLost={true} isJustLost={true} testId="heart-cracking" />
      </div>
    );

    const full = getByTestId('heart-full');
    expect(full.getAttribute('data-state')).toBe('full');
    expect(full.classList.contains('heart-losing')).toBe(false);

    const empty = getByTestId('heart-empty');
    expect(empty.getAttribute('data-state')).toBe('empty');
    expect(empty.classList.contains('heart-losing')).toBe(false);

    const cracking = getByTestId('heart-cracking');
    expect(cracking.getAttribute('data-state')).toBe('empty');
    expect(cracking.classList.contains('heart-losing')).toBe(true);
  });

  it('exports 10 REGION_GLYPH_IDS and renders distinct RegionGlyphIcon SVGs for regions 0..9', () => {
    expect(REGION_GLYPH_IDS).toEqual([
      'paw',
      'fish',
      'yarn',
      'bell',
      'star',
      'moon',
      'mouse',
      'crown',
      'heart',
      'milk',
    ]);

    const { container } = render(
      <div>
        {REGION_GLYPH_IDS.map((_, idx) => (
          <RegionGlyphIcon key={idx} regionId={idx} size={14} />
        ))}
      </div>
    );

    const svgs = container.querySelectorAll('svg[data-region-glyph]');
    expect(svgs).toHaveLength(10);
    REGION_GLYPH_IDS.forEach((glyphId, idx) => {
      expect(svgs[idx].getAttribute('data-region-glyph')).toBe(glyphId);
      expect(svgs[idx].getAttribute('width')).toBe('14');
    });
  });

  it('enforces Zero-Emoji Audit across all source files in src/', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    const forbiddenEmojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{2714}\u{2716}-\u{27BF}\u{2B50}\u{21BA}]/u;
    const violations: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
          const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
          lines.forEach((line, idx) => {
            if (forbiddenEmojiRegex.test(line)) {
              violations.push(`${path.relative(srcDir, fullPath)}:${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }

    walk(srcDir);
    expect(violations).toEqual([]);
  });
});
