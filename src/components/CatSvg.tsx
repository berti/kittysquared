import { useMemo } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import { CatAnimState, CatVariant } from '../types/puzzle';

export interface CatSvgProps {
  variant: CatVariant;
  state: CatAnimState;
}

const HEAD_PATH =
  'M 24 12.8 Q 27.5 12.8, 30.5 14.0 Q 34.2 9.2, 37.8 6.8 Q 39.6 5.6, 40.2 7.8 Q 41.4 13.5, 40.8 20.2 C 43.2 27.2, 41.2 39.2, 24 40.2 C 6.8 39.2, 4.8 27.2, 7.2 20.2 Q 6.6 13.5, 7.8 7.8 Q 8.4 5.6, 10.2 6.8 Q 13.8 9.2, 17.5 14.0 Q 20.5 12.8, 24 12.8 Z';
const LEFT_EAR_PATH =
  'M 7.2 20.2 Q 6.6 13.5, 7.8 7.8 Q 8.4 5.6, 10.2 6.8 Q 13.8 9.2, 17.5 14.0 Q 12 17.5, 7.2 20.2 Z';
const RIGHT_EAR_PATH =
  'M 30.5 14.0 Q 34.2 9.2, 37.8 6.8 Q 39.6 5.6, 40.2 7.8 Q 41.4 13.5, 40.8 20.2 Q 36 17.5, 30.5 14.0 Z';
const LEFT_INNER_EAR =
  'M 9.8 18.2 Q 9.5 13.5, 10.2 9.8 Q 10.5 8.8, 11.4 9.6 Q 13.8 11.6, 15.8 14.8 Q 12.6 16.4, 9.8 18.2 Z';
const RIGHT_INNER_EAR =
  'M 38.2 18.2 Q 38.5 13.5, 37.8 9.8 Q 37.5 8.8, 36.6 9.6 Q 34.2 11.6, 32.2 14.8 Q 35.4 16.4, 38.2 18.2 Z';

interface BreedTheme {
  baseFill: string;
  outline: string;
  innerEar: string;
  eyeIris: string;
  eyePupil: string;
  eyeStroke: string;
  nose: string;
  mouth: string;
  whisker: string;
  rimHighlight: string;
  markings: ComponentChildren;
}

const BREED_THEMES: Record<CatVariant, BreedTheme> = {
  black: {
    baseFill: '#231F2B',
    outline: '#14111A',
    innerEar: '#FF8FA3',
    eyeIris: '#FBBF24',
    eyePupil: '#181420',
    eyeStroke: '#FFFFFF',
    nose: '#FF8FA3',
    mouth: '#FFFFFF',
    whisker: '#FFFFFF',
    rimHighlight: 'rgba(255,255,255,0.16)',
    markings: (
      <path
        d="M 16 15 Q 24 13.5 32 15"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    ),
  },
  white: {
    baseFill: '#FFFDF9',
    outline: '#352A2E',
    innerEar: '#FFA6C1',
    eyeIris: '#38BDF8',
    eyePupil: '#1E293B',
    eyeStroke: '#352A2E',
    nose: '#FF7597',
    mouth: '#352A2E',
    whisker: '#352A2E',
    rimHighlight: 'rgba(255,255,255,0.8)',
    markings: (
      <>
        <ellipse cx="11.5" cy="29.5" rx="3.2" ry="2" fill="rgba(255,166,193,0.35)" />
        <ellipse cx="36.5" cy="29.5" rx="3.2" ry="2" fill="rgba(255,166,193,0.35)" />
      </>
    ),
  },
  orange: {
    baseFill: '#FB923C',
    outline: '#3B2314',
    innerEar: '#FFA6C1',
    eyeIris: '#10B981',
    eyePupil: '#1B2420',
    eyeStroke: '#3B2314',
    nose: '#FF7597',
    mouth: '#3B2314',
    whisker: '#3B2314',
    rimHighlight: 'rgba(255,255,255,0.28)',
    markings: (
      <>
        <ellipse cx="24" cy="32.3" rx="8.5" ry="6.2" fill="#FFFBEB" />
        <path
          d="M 24 12.5 L 24 18.2 M 19.8 13.8 L 21.2 18.0 M 28.2 13.8 L 26.8 18.0"
          stroke="#C2410C"
          strokeWidth={2.3}
          strokeLinecap="round"
        />
        <path
          d="M 5 22.5 Q 9.5 22.8 11.2 24.2 M 5 25.5 Q 9.2 25.8 10.8 26.8"
          stroke="#C2410C"
          strokeWidth={2.0}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 43 22.5 Q 38.5 22.8 36.8 24.2 M 43 25.5 Q 38.8 25.8 37.2 26.8"
          stroke="#C2410C"
          strokeWidth={2.0}
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  siamese: {
    baseFill: '#F5EFE6',
    outline: '#2B1B12',
    innerEar: '#382216',
    eyeIris: '#38BDF8',
    eyePupil: '#0F172A',
    eyeStroke: '#23140D',
    nose: '#FF8FA3',
    mouth: '#23140D',
    whisker: '#2B1B12',
    rimHighlight: 'rgba(255,255,255,0.4)',
    markings: (
      <>
        <path d={LEFT_EAR_PATH} fill="#4A2F21" />
        <path d={RIGHT_EAR_PATH} fill="#4A2F21" />
        <ellipse cx="24" cy="26.2" rx="13.2" ry="8.4" fill="#9A6F55" />
        <ellipse cx="24" cy="28.2" rx="8.2" ry="5.5" fill="#7D563F" />
      </>
    ),
  },
  calico: {
    baseFill: '#FFFDF9',
    outline: '#2D2327',
    innerEar: '#FFA6C1',
    eyeIris: '#F59E0B',
    eyePupil: '#1F191C',
    eyeStroke: '#2D2327',
    nose: '#FF7597',
    mouth: '#2D2327',
    whisker: '#2D2327',
    rimHighlight: 'rgba(255,255,255,0.45)',
    markings: (
      <>
        <path d={LEFT_EAR_PATH} fill="#EA580C" />
        <path d={RIGHT_EAR_PATH} fill="#332B3B" />
        <circle cx="39.5" cy="33.5" r="5.5" fill="#FB923C" />
      </>
    ),
  },
  tuxedo: {
    baseFill: '#201C29',
    outline: '#14111A',
    innerEar: '#FF8FA3',
    eyeIris: '#22C55E',
    eyePupil: '#111827',
    eyeStroke: '#FFFFFF',
    nose: '#FF8FA3',
    mouth: '#201C29',
    whisker: '#FFFFFF',
    rimHighlight: 'rgba(255,255,255,0.18)',
    markings: (
      <>
        <path
          d="M 24 21.5 C 21.5 26.5, 13.5 29.2, 8.5 38 L 39.5 38 C 34.5 29.2, 26.5 26.5, 24 21.5 Z"
          fill="#FFFDF9"
        />
        <rect x="6" y="35" width="36" height="8" fill="#FFFDF9" />
      </>
    ),
  },
  russian: {
    baseFill: '#64748B',
    outline: '#1E2631',
    innerEar: '#F4ACB7',
    eyeIris: '#34D399',
    eyePupil: '#0F172A',
    eyeStroke: '#1E2631',
    nose: '#FDA4AF',
    mouth: '#1E2631',
    whisker: '#F8FAFC',
    rimHighlight: 'rgba(255,255,255,0.22)',
    markings: (
      <>
        <ellipse cx="24" cy="31.8" rx="7.5" ry="5.2" fill="#94A3B8" />
        <path
          d="M 20 15.5 Q 24 13.5 28 15.5 M 21.5 18 Q 24 16.5 26.5 18"
          fill="none"
          stroke="#1E2631"
          strokeWidth={2.1}
          strokeLinecap="round"
        />
      </>
    ),
  },
  sakura: {
    baseFill: '#FDA4AF',
    outline: '#6B1D2F',
    innerEar: '#FFF1F2',
    eyeIris: '#A855F7',
    eyePupil: '#2E1065',
    eyeStroke: '#6B1D2F',
    nose: '#E11D48',
    mouth: '#6B1D2F',
    whisker: '#6B1D2F',
    rimHighlight: 'rgba(255,255,255,0.45)',
    markings: (
      <>
        <ellipse cx="24" cy="32.3" rx="8.2" ry="5.8" fill="#FFF1F2" />
        <circle cx="24" cy="16.2" r="2.1" fill="#FFF1F2" />
        <circle cx="22.2" cy="15.2" r="1.3" fill="#FFF1F2" />
        <circle cx="25.8" cy="15.2" r="1.3" fill="#FFF1F2" />
      </>
    ),
  },
};

let instanceCounter = 0;

export function CatSvg({ variant, state }: CatSvgProps) {
  const { blinkDelay, blinkDuration, clipId } = useMemo(() => {
    const delay = (Math.random() * 4 + 1).toFixed(2);
    const duration = (Math.random() * 5 + 3.5).toFixed(2);
    const id = `clip-cat-${++instanceCounter}`;
    return {
      blinkDelay: `${delay}s`,
      blinkDuration: `${duration}s`,
      clipId: id,
    };
  }, []);

  const theme = BREED_THEMES[variant] ?? BREED_THEMES.black;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 48 48"
      className={`cat-svg cat-${state}`}
      data-cat-state={state}
      data-blink-delay={blinkDelay}
      style={{
        '--blink-delay': blinkDelay,
        '--blink-duration': blinkDuration,
      } as Record<string, string>}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={HEAD_PATH} />
        </clipPath>
      </defs>

      <g filter="drop-shadow(0 2px 2px rgba(0,0,0,0.22))">
        {/* 1. Base Head Fill */}
        <path data-cat-part="head" d={HEAD_PATH} fill={theme.baseFill} />

        {/* 2. Clipped Markings & Soft-Clay Shading */}
        <g
          clipPath={`url(#${clipId})`}
          clip-path={`url(#${clipId})`}
          style={{ clipPath: `url(#${clipId})` }}
          data-cat-part="markings"
        >
          {theme.markings}
          {/* Forehead top highlight */}
          <path
            d="M 18 13.8 Q 24 15 30 13.8"
            fill="none"
            stroke={theme.rimHighlight}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          {/* Bottom shadow */}
          <path
            d="M 8 38 Q 24 43 40 38"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={4}
          />
        </g>

        {/* 3. Nested Inner Ears */}
        <g data-cat-part="ears">
          <path d={LEFT_INNER_EAR} fill={theme.innerEar} />
          <path d={RIGHT_INNER_EAR} fill={theme.innerEar} />
        </g>

        {/* 4. Master Head Outline */}
        <path
          d={HEAD_PATH}
          fill="none"
          stroke={theme.outline}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 5. 4 Whiskers */}
        <line
          data-cat-part="whisker"
          x1="2.2"
          y1="26.8"
          x2="9.2"
          y2="27.7"
          stroke={theme.whisker}
          strokeWidth={1.85}
          strokeLinecap="round"
        />
        <line
          data-cat-part="whisker"
          x1="2.8"
          y1="30.8"
          x2="9.2"
          y2="30.2"
          stroke={theme.whisker}
          strokeWidth={1.85}
          strokeLinecap="round"
        />
        <line
          data-cat-part="whisker"
          x1="45.8"
          y1="26.8"
          x2="38.8"
          y2="27.7"
          stroke={theme.whisker}
          strokeWidth={1.85}
          strokeLinecap="round"
        />
        <line
          data-cat-part="whisker"
          x1="45.2"
          y1="30.8"
          x2="38.8"
          y2="30.2"
          stroke={theme.whisker}
          strokeWidth={1.85}
          strokeLinecap="round"
        />

        {/* 6. Nose */}
        <path
          data-cat-part="nose"
          d="M 22.0 27.2 Q 24 26.6 26.0 27.2 Q 24 29.8 22.0 27.2 Z"
          fill={theme.nose}
        />

        {/* 7. Expressions */}
        {state === 'idle' && (
          <>
            <g className="cat-eyes-blink" style={{ transformOrigin: '24px 24.2px' }}>
              {/* Left Eye */}
              <circle
                cx="16.0"
                cy="24.2"
                r="4.5"
                fill={theme.eyeIris}
                stroke={theme.outline}
                strokeWidth={1.2}
              />
              <ellipse cx="16.0" cy="24.2" rx="2.6" ry="3.5" fill={theme.eyePupil} />
              <circle cx="14.7" cy="22.8" r="1.45" fill="#FFFFFF" />
              <circle cx="17.2" cy="25.5" r="0.7" fill="#FFFFFF" />

              {/* Right Eye */}
              <circle
                cx="32.0"
                cy="24.2"
                r="4.5"
                fill={theme.eyeIris}
                stroke={theme.outline}
                strokeWidth={1.2}
              />
              <ellipse cx="32.0" cy="24.2" rx="2.6" ry="3.5" fill={theme.eyePupil} />
              <circle cx="30.7" cy="22.8" r="1.45" fill="#FFFFFF" />
              <circle cx="33.2" cy="25.5" r="0.7" fill="#FFFFFF" />
            </g>
            <path
              data-cat-part="mouth"
              d="M 20.4 30.8 Q 22.2 32.8 24 30.6 Q 25.8 32.8 27.6 30.8"
              fill="none"
              stroke={theme.mouth}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'placed' && (
          <>
            {/* Happy arch eyes */}
            <path
              data-cat-part="eye-closed"
              d="M 12.2 25.0 Q 16.0 20.0 19.8 25.0"
              fill="none"
              stroke={theme.eyeStroke}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            <path
              data-cat-part="eye-closed"
              d="M 28.2 25.0 Q 32.0 20.0 35.8 25.0"
              fill="none"
              stroke={theme.eyeStroke}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            <path
              data-cat-part="mouth"
              d="M 20.0 30.8 Q 22.0 33.2 24 30.8 Q 26.0 33.2 28.0 30.8"
              fill="none"
              stroke={theme.mouth}
              strokeWidth={1.9}
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'conflict' && (
          <>
            {/* Startled > < eyes */}
            <path
              data-cat-part="eye-closed"
              d="M 12.8 21.4 L 18.6 24.2 L 12.8 27.0"
              fill="none"
              stroke={theme.eyeStroke}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              data-cat-part="eye-closed"
              d="M 35.2 21.4 L 29.4 24.2 L 35.2 27.0"
              fill="none"
              stroke={theme.eyeStroke}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              data-cat-part="mouth"
              d="M 20.2 32.0 Q 22.1 29.8 24 32.0 Q 25.9 33.8 27.8 32.0"
              fill="none"
              stroke={theme.mouth}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'victory' && (
          <>
            {/* Blush cheeks */}
            <ellipse cx="12.8" cy="28.0" rx="3.0" ry="1.7" fill="#FF7597" opacity={0.85} />
            <ellipse cx="35.2" cy="28.0" rx="3.0" ry="1.7" fill="#FF7597" opacity={0.85} />
            {/* Joyful eyes */}
            <path
              data-cat-part="eye-closed"
              d="M 12.2 24.7 Q 16.0 19.7 19.8 24.7"
              fill="none"
              stroke={theme.eyeStroke}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            <path
              data-cat-part="eye-closed"
              d="M 28.2 24.7 Q 32.0 19.7 35.8 24.7"
              fill="none"
              stroke={theme.eyeStroke}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            {/* Open happy mouth */}
            <path
              data-cat-part="mouth"
              d="M 20.6 30.6 Q 24 36.0 27.4 30.6 Z"
              fill="#FF7597"
              stroke={theme.outline}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </>
        )}
      </g>
    </svg>
  );
}
