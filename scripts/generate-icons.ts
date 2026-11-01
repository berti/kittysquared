import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate standalone cat SVG content for icon
function getCatIconSvg(options: {
  size: number;
  isMaskable?: boolean;
  background?: string;
}) {
  const { size, isMaskable = false, background = '#FBF9F5' } = options;

  // Maskable icons require safe zone (inner 80% = 409px at 512)
  // Scale cat vector (original viewBox 48x48)
  const catScale = isMaskable ? 7.0 : 8.5; // at size 512
  const scaledCatSize = 48 * (catScale * (size / 512));
  const catOffset = (size - scaledCatSize) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.18" />
    </filter>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F4ECE1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${background}" />

  ${
    !isMaskable
      ? `<!-- Subtle Inner Card Border -->
  <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.92}" rx="${size * 0.22}" fill="url(#bgGrad)" stroke="#E2D7C7" stroke-width="${size * 0.02}" />`
      : ''
  }

  <!-- Centered Kitty Art -->
  <g transform="translate(${catOffset}, ${catOffset + (isMaskable ? 0 : size * 0.02)}) scale(${catScale * (size / 512)})">
    <g filter="url(#shadow)">
      <!-- Head with pointy ears (Cozy Dark / Black Cat variant) -->
      <path
        d="M7 22 L6 6 L18 14 Q24 12.5 30 14 L42 6 L41 22 C43 32 36 39 24 39 C12 39 5 32 7 22 Z"
        fill="#1F1B24"
        stroke="#FFFFFF"
        stroke-width="2.2"
        stroke-linejoin="round"
      />

      <!-- Ears detail -->
      <polygon points="9.5,10.5 9,18 15.5,15" fill="#FF8FA3" />
      <polygon points="38.5,10.5 39,18 32.5,15" fill="#FF8FA3" />

      <!-- Whiskers -->
      <line x1="3" y1="26" x2="9.5" y2="27" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
      <line x1="3.5" y1="30" x2="9.5" y2="29.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
      <line x1="45" y1="26" x2="38.5" y2="27" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
      <line x1="44.5" y1="30" x2="38.5" y2="29.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />

      <!-- Nose -->
      <polygon points="24,29.5 21.8,27.2 26.2,27.2" fill="#FF8FA3" />

      <!-- Big expressive eyes with sparkle -->
      <circle cx="16.5" cy="24.5" r="5.1" fill="#FFFFFF" />
      <circle cx="17.2" cy="24.5" r="3.2" fill="#1F1B24" />
      <circle cx="15.8" cy="23.2" r="1.3" fill="#FFFFFF" />

      <circle cx="31.5" cy="24.5" r="5.1" fill="#FFFFFF" />
      <circle cx="30.8" cy="24.5" r="3.2" fill="#1F1B24" />
      <circle cx="29.8" cy="23.2" r="1.3" fill="#FFFFFF" />

      <!-- Smile mouth -->
      <path
        d="M20.2 31.2 Q22.1 33.2 24 31 Q25.9 33.2 27.8 31.2"
        fill="none"
        stroke="#FFFFFF"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </g>
  </g>
</svg>`;
}

function getFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path
    d="M7 22 L6 6 L18 14 Q24 12.5 30 14 L42 6 L41 22 C43 32 36 39 24 39 C12 39 5 32 7 22 Z"
    fill="#1F1B24"
    stroke="#E2D7C7"
    stroke-width="2.2"
    stroke-linejoin="round"
  />
  <polygon points="9.5,10.5 9,18 15.5,15" fill="#FF8FA3" />
  <polygon points="38.5,10.5 39,18 32.5,15" fill="#FF8FA3" />
  <circle cx="16.5" cy="24.5" r="4.5" fill="#FFFFFF" />
  <circle cx="17.2" cy="24.5" r="2.8" fill="#1F1B24" />
  <circle cx="15.8" cy="23.2" r="1.1" fill="#FFFFFF" />
  <circle cx="31.5" cy="24.5" r="4.5" fill="#FFFFFF" />
  <circle cx="30.8" cy="24.5" r="2.8" fill="#1F1B24" />
  <circle cx="29.8" cy="23.2" r="1.1" fill="#FFFFFF" />
  <polygon points="24,29.5 21.8,27.2 26.2,27.2" fill="#FF8FA3" />
  <path
    d="M20.2 31.2 Q22.1 33.2 24 31 Q25.9 33.2 27.8 31.2"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="1.5"
    stroke-linecap="round"
  />
</svg>`;
}

async function generate() {
  console.log('Generating PWA and web icons...');

  // 1. Favicon SVG
  const faviconSvg = getFaviconSvg();
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf-8');

  // 2. Icon SVGs
  const icon512Svg = getCatIconSvg({ size: 512, isMaskable: false });
  const iconMaskableSvg = getCatIconSvg({ size: 512, isMaskable: true });
  const appleSvg = getCatIconSvg({ size: 180, isMaskable: false });

  const tmp512 = path.join(publicDir, 'tmp-icon-512.svg');
  const tmpMaskable = path.join(publicDir, 'tmp-maskable.svg');
  const tmpApple = path.join(publicDir, 'tmp-apple.svg');

  fs.writeFileSync(tmp512, icon512Svg, 'utf-8');
  fs.writeFileSync(tmpMaskable, iconMaskableSvg, 'utf-8');
  fs.writeFileSync(tmpApple, appleSvg, 'utf-8');

  try {
    // 3. Convert to PNG using ImageMagick
    execSync(`convert -background none "${tmp512}" -resize 512x512 "${path.join(publicDir, 'icon-512.png')}"`);
    execSync(`convert -background none "${tmp512}" -resize 192x192 "${path.join(publicDir, 'icon-192.png')}"`);
    execSync(`convert -background none "${tmpMaskable}" -resize 512x512 "${path.join(publicDir, 'icon-512-maskable.png')}"`);
    execSync(`convert -background none "${tmpApple}" -resize 180x180 "${path.join(publicDir, 'apple-touch-icon.png')}"`);
    execSync(`convert -background none "${tmp512}" -resize 48x48 "${path.join(publicDir, 'favicon.ico')}"`);

    console.log('Successfully generated all icons in public/');
  } finally {
    if (fs.existsSync(tmp512)) fs.unlinkSync(tmp512);
    if (fs.existsSync(tmpMaskable)) fs.unlinkSync(tmpMaskable);
    if (fs.existsSync(tmpApple)) fs.unlinkSync(tmpApple);
  }
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
