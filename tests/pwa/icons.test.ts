import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getCatIconSvg, getFaviconSvg } from '../../scripts/generate-icons';

describe('PWA and Web Icons', () => {
  const publicDir = path.resolve(process.cwd(), 'public');

  it('generates favicon.svg with latest orange tabby cat colors and paths', () => {
    const faviconSvg = getFaviconSvg();
    expect(faviconSvg).toContain('width="48" height="48"');
    // Orange tabby cat colors
    expect(faviconSvg).toContain('#FB923C'); // Orange base fill
    expect(faviconSvg).toContain('#3B2314'); // Cocoa outline & whiskers
    expect(faviconSvg).toContain('#10B981'); // Emerald iris
    expect(faviconSvg).toContain('#FFFBEB'); // Cream muzzle bib
    expect(faviconSvg).toContain('#C2410C'); // Tabby forehead/cheek stripes
    expect(faviconSvg).toContain('#FFA6C1'); // Inner ears
  });

  it('generates getCatIconSvg with solid white background and centered orange cat', () => {
    const iconSvg = getCatIconSvg({ size: 512, isMaskable: false });
    expect(iconSvg).toContain('width="512" height="512"');
    expect(iconSvg).toContain('fill="#FFFFFF"');
    expect(iconSvg).toContain('#FB923C');
    expect(iconSvg).toContain('#10B981');
  });

  it('ensures all icon assets exist in public/ with non-zero size and latest orange tabby cat in favicon.svg', () => {
    const faviconSvgPath = path.join(publicDir, 'favicon.svg');
    expect(fs.existsSync(faviconSvgPath)).toBe(true);
    const content = fs.readFileSync(faviconSvgPath, 'utf-8');
    expect(content).toContain('#FB923C');
    expect(content).toContain('#10B981');

    const files = [
      'icon-192.png',
      'icon-512.png',
      'icon-512-maskable.png',
      'apple-touch-icon.png',
      'favicon.ico',
    ];

    for (const file of files) {
      const filePath = path.join(publicDir, file);
      expect(fs.existsSync(filePath), `${file} should exist`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size, `${file} should have non-zero size`).toBeGreaterThan(100);
    }
  });
});
