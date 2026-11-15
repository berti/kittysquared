import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

export const HEAD_PATH =
  'M 24 12.8 Q 27.5 12.8, 30.5 14.0 Q 34.2 9.2, 37.8 6.8 Q 39.6 5.6, 40.2 7.8 Q 41.4 13.5, 40.8 20.2 C 43.2 27.2, 41.2 39.2, 24 40.2 C 6.8 39.2, 4.8 27.2, 7.2 20.2 Q 6.6 13.5, 7.8 7.8 Q 8.4 5.6, 10.2 6.8 Q 13.8 9.2, 17.5 14.0 Q 20.5 12.8, 24 12.8 Z';
export const LEFT_INNER_EAR =
  'M 9.8 18.2 Q 9.5 13.5, 10.2 9.8 Q 10.5 8.8, 11.4 9.6 Q 13.8 11.6, 15.8 14.8 Q 12.6 16.4, 9.8 18.2 Z';
export const RIGHT_INNER_EAR =
  'M 38.2 18.2 Q 38.5 13.5, 37.8 9.8 Q 37.5 8.8, 36.6 9.6 Q 34.2 11.6, 32.2 14.8 Q 35.4 16.4, 38.2 18.2 Z';

export function getOrangeTabbySvgInner(): string {
  return `
    <defs>
      <clipPath id="catClip">
        <path d="${HEAD_PATH}" />
      </clipPath>
    </defs>
    <!-- Base Head Fill -->
    <path d="${HEAD_PATH}" fill="#FB923C" />

    <!-- Clipped Markings & Soft-Clay Shading -->
    <g clip-path="url(#catClip)">
      <ellipse cx="24" cy="32.3" rx="8.5" ry="6.2" fill="#FFFBEB" />
      <path d="M 24 12.5 L 24 18.2 M 19.8 13.8 L 21.2 18.0 M 28.2 13.8 L 26.8 18.0" stroke="#C2410C" stroke-width="2.3" stroke-linecap="round" />
      <path d="M 5 22.5 Q 9.5 22.8 11.2 24.2 M 5 25.5 Q 9.2 25.8 10.8 26.8" stroke="#C2410C" stroke-width="2.0" stroke-linecap="round" fill="none" />
      <path d="M 43 22.5 Q 38.5 22.8 36.8 24.2 M 43 25.5 Q 38.8 25.8 37.2 26.8" stroke="#C2410C" stroke-width="2.0" stroke-linecap="round" fill="none" />
      <path d="M 18 13.8 Q 24 15 30 13.8" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.4" stroke-linecap="round" />
      <path d="M 8 38 Q 24 43 40 38" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4" />
    </g>

    <!-- Inner ears -->
    <path d="${LEFT_INNER_EAR}" fill="#FFA6C1" />
    <path d="${RIGHT_INNER_EAR}" fill="#FFA6C1" />

    <!-- Master Head Outline -->
    <path d="${HEAD_PATH}" fill="none" stroke="#3B2314" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

    <!-- Whiskers -->
    <line x1="2.2" y1="26.8" x2="9.2" y2="27.7" stroke="#3B2314" stroke-width="1.85" stroke-linecap="round" />
    <line x1="2.8" y1="30.8" x2="9.2" y2="30.2" stroke="#3B2314" stroke-width="1.85" stroke-linecap="round" />
    <line x1="45.8" y1="26.8" x2="38.8" y2="27.7" stroke="#3B2314" stroke-width="1.85" stroke-linecap="round" />
    <line x1="45.2" y1="30.8" x2="38.8" y2="30.2" stroke="#3B2314" stroke-width="1.85" stroke-linecap="round" />

    <!-- Nose -->
    <path d="M 22.0 27.2 Q 24 26.6 26.0 27.2 Q 24 29.8 22.0 27.2 Z" fill="#FF7597" />

    <!-- Expressive Eyes -->
    <circle cx="16.0" cy="24.2" r="4.5" fill="#10B981" stroke="#3B2314" stroke-width="1.2" />
    <ellipse cx="16.0" cy="24.2" rx="2.6" ry="3.5" fill="#1B2420" />
    <circle cx="14.7" cy="22.8" r="1.45" fill="#FFFFFF" />
    <circle cx="17.2" cy="25.5" r="0.7" fill="#FFFFFF" />

    <circle cx="32.0" cy="24.2" r="4.5" fill="#10B981" stroke="#3B2314" stroke-width="1.2" />
    <ellipse cx="32.0" cy="24.2" rx="2.6" ry="3.5" fill="#1B2420" />
    <circle cx="30.7" cy="22.8" r="1.45" fill="#FFFFFF" />
    <circle cx="33.2" cy="25.5" r="0.7" fill="#FFFFFF" />

    <!-- Smile mouth -->
    <path d="M 20.4 30.8 Q 22.2 32.8 24 30.6 Q 25.8 32.8 27.6 30.8" fill="none" stroke="#3B2314" stroke-width="1.8" stroke-linecap="round" />
`;
}

export function getCatIconSvg(options: {
  size: number;
  isMaskable?: boolean;
  background?: string;
}): string {
  const { size, isMaskable = false, background = '#FFFFFF' } = options;

  // Maskable: scale = 7.3 (inside Android 80% circle safe zone)
  // Standard: scale = 8.333333 (prominent, centered)
  const baseScale = isMaskable ? 7.3 : 8.333333;
  const catScale = baseScale * (size / 512);
  const catOffset = (size - 48 * catScale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="catShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#3B2314" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Clean solid white background -->
  <rect width="${size}" height="${size}" fill="${background}" />

  <!-- Centered Orange Tabby Cat -->
  <g transform="translate(${catOffset}, ${catOffset}) scale(${catScale})">
    <g filter="url(#catShadow)">
      ${getOrangeTabbySvgInner()}
    </g>
  </g>
</svg>`;
}

export function getFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  ${getOrangeTabbySvgInner()}
</svg>`;
}

export async function generateIcons(): Promise<void> {
  console.log('Generating PWA and web icons with orange tabby cat...');

  // 1. Favicon SVG
  const faviconSvg = getFaviconSvg();
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf-8');

  // 2. Render PNGs via Resvg
  const renderPng = (svgString: string, size: number): Buffer => {
    const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: size } });
    return resvg.render().asPng();
  };

  const svg512 = getCatIconSvg({ size: 512, isMaskable: false });
  const svgMaskable = getCatIconSvg({ size: 512, isMaskable: true });
  const svg180 = getCatIconSvg({ size: 180, isMaskable: false });

  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), renderPng(svg512, 512));
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), renderPng(svg512, 192));
  fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), renderPng(svgMaskable, 512));
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPng(svg180, 180));

  // 3. Favicon ICO (48x48)
  const icoPng = renderPng(svg512, 48);
  const tmpIcoPng = path.join(publicDir, 'tmp-ico-48.png');
  fs.writeFileSync(tmpIcoPng, icoPng);
  try {
    execSync(`convert "${tmpIcoPng}" "${path.join(publicDir, 'favicon.ico')}"`);
  } finally {
    if (fs.existsSync(tmpIcoPng)) fs.unlinkSync(tmpIcoPng);
  }

  console.log('Successfully generated all icons in public/');
}

// When invoked directly via CLI (tsx scripts/generate-icons.ts)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('generate-icons.ts') || process.argv[1].endsWith('generate-icons.js'));

if (isDirectRun) {
  generateIcons().catch((err) => {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  });
}
