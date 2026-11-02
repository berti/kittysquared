export interface IconProps {
  size?: number;
  className?: string;
  testId?: string;
}

export const REGION_GLYPH_IDS = [
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
] as const;

export type RegionGlyphId = (typeof REGION_GLYPH_IDS)[number];

export function GearIcon({ size = 22, className, testId = 'icon-gear' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.41 1.09H21a2 2 0 1 1 0 4h-.09c-.64.07-1.15.49-1.51 1.01Z"
        fill="#FFD166"
        stroke="#4A3B32"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" fill="#FFFDF9" stroke="#4A3B32" strokeWidth="1.8" />
    </svg>
  );
}

export function RestartIcon({ size = 22, className, testId = 'icon-restart' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M4.5 10.5A8 8 0 1 1 6.2 17"
        stroke="#4A3B32"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M4 5.5v5.2h5.2"
        stroke="#FF7E67"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MiniCatIcon({ size = 20, className, testId = 'icon-mini-cat' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M5 10.5 6.2 4.5l4.2 3.2h3.2l4.2-3.2L19 10.5c1.1 1.3 1.6 2.8 1.6 4.4 0 3.5-3.6 5.6-8.6 5.6s-8.6-2.1-8.6-5.6c0-1.6.5-3.1 1.6-4.4Z"
        fill="#FFB5A7"
        stroke="#4A3B32"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9.2" cy="13.5" r="1.2" fill="#4A3B32" />
      <circle cx="14.8" cy="13.5" r="1.2" fill="#4A3B32" />
      <path d="M11.2 15.6h1.6l-.8 1Z" fill="#FF7E67" />
    </svg>
  );
}

export function PawCoinIcon({ size = 20, className, testId = 'score-paw-coin-icon' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="#FFB703" stroke="#B45309" strokeWidth="2" />
      <path
        d="M8.5 14.8 C8.5 12.6, 15.5 12.6, 15.5 14.8 C15.5 16.5, 13.8 17.2, 12 17.2 C10.2 17.2, 8.5 16.5, 8.5 14.8 Z"
        fill="#B45309"
      />
      <ellipse
        cx="7.8"
        cy="10.8"
        rx="1.4"
        ry="1.8"
        transform="rotate(-20 7.8 10.8)"
        fill="#B45309"
      />
      <ellipse
        cx="10.6"
        cy="9.2"
        rx="1.4"
        ry="1.9"
        transform="rotate(-6 10.6 9.2)"
        fill="#B45309"
      />
      <ellipse
        cx="13.4"
        cy="9.2"
        rx="1.4"
        ry="1.9"
        transform="rotate(6 13.4 9.2)"
        fill="#B45309"
      />
      <ellipse
        cx="16.2"
        cy="10.8"
        rx="1.4"
        ry="1.8"
        transform="rotate(20 16.2 10.8)"
        fill="#B45309"
      />
    </svg>
  );
}

export function WarningIcon({ size = 22, className, testId = 'icon-warning' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M10.3 4.2a2 2 0 0 1 3.4 0l7.4 12.8A2 2 0 0 1 19.4 20H4.6a2 2 0 0 1-1.7-3L10.3 4.2Z"
        fill="#FFD166"
        stroke="#4A3B32"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 9v4.5" stroke="#4A3B32" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.6" r="1.2" fill="#4A3B32" />
    </svg>
  );
}

export function ControlsTabIcon({ size = 20, className, testId = 'icon-tab-controls' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="6"
        fill="#A8E6CF"
        stroke="#4A3B32"
        strokeWidth="1.8"
      />
      <path d="M8.5 10v4M6.5 12h4" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="10.8" r="1.2" fill="#FF7E67" />
      <circle cx="17.2" cy="13" r="1.2" fill="#4A3B32" />
    </svg>
  );
}

export function GraphicsTabIcon({ size = 20, className, testId = 'icon-tab-graphics' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M12 3a9 9 0 1 0 0 18c1.5 0 2.5-1.1 2.5-2.4 0-.6-.2-1.2-.6-1.6-.4-.4-.6-.9-.6-1.5 0-1.3 1.1-2.3 2.4-2.3H17a4 4 0 0 0 4-4c0-3.4-4-6.2-9-6.2Z"
        fill="#FFDFD3"
        stroke="#4A3B32"
        strokeWidth="1.8"
      />
      <circle cx="8" cy="10" r="1.5" fill="#FF7E67" />
      <circle cx="11.5" cy="7.5" r="1.5" fill="#FFD166" />
      <circle cx="15.5" cy="9.5" r="1.5" fill="#70C1B3" />
    </svg>
  );
}

export function SoundTabIcon({ size = 20, className, testId = 'icon-tab-sound' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M11 5.5 6.8 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.8L11 18.5a1 1 0 0 0 1.6-.8V6.3a1 1 0 0 0-1.6-.8Z"
        fill="#FFD166"
        stroke="#4A3B32"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 9.2a4.2 4.2 0 0 1 0 5.6M18.4 6.8a7.5 7.5 0 0 1 0 10.4"
        stroke="#FF7E67"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AssistsTabIcon({ size = 20, className, testId = 'icon-tab-ayudas' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.7.6 1.2 1.4 1.3 2.4h5c.1-1 .6-1.8 1.3-2.4A6 6 0 0 0 12 3Z"
        fill="#FFE66D"
        stroke="#4A3B32"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TapFingerIcon({ size = 28, className, testId = 'icon-tap-prompt' }: IconProps) {
  return (
    <svg
      data-testid={testId}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M8.5 7.5a3.5 3.5 0 0 1 7 0"
        stroke="#FF7E67"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.2 13V7.8a1.8 1.8 0 0 1 3.6 0V11h1.4a1.6 1.6 0 0 1 1.6 1.6v.6h.8a1.6 1.6 0 0 1 1.6 1.6v2.4a4.2 4.2 0 0 1-4.2 4.2h-3.4a4.2 4.2 0 0 1-3.6-2l-1.9-3.1a1.5 1.5 0 0 1 2.4-1.7l1.7 1.2V13Z"
        fill="#FFE5D4"
        stroke="#4A3B32"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface HeartSvgProps {
  isLost: boolean;
  isJustLost?: boolean;
  size?: number;
  testId?: string;
}

export function HeartSvg({
  isLost,
  isJustLost = false,
  size = 20,
  testId,
}: HeartSvgProps) {
  const isFull = !isLost;
  const fill = isFull ? '#EF4444' : '#D8CBB8';
  const stroke = isFull ? '#B91C1C' : '#BDAE98';

  return (
    <svg
      data-testid={testId}
      data-state={isFull ? 'full' : 'empty'}
      className={isJustLost ? 'heart-losing' : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}
    >
      {isFull ? (
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.6"
        />
      ) : (
        <>
          <path
            className="heart-half-left"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09L10.5 9.5l2.2 3.5-1.5 3.5L12 21.35z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.4"
          />
          <path
            className="heart-half-right"
            d="M12 5.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35l-.8-4.85 1.5-3.5-2.2-3.5L12 5.09z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.4"
          />
        </>
      )}
    </svg>
  );
}

export interface RegionGlyphIconProps {
  regionId: number;
  size?: number;
}

export function RegionGlyphIcon({ regionId, size = 13 }: RegionGlyphIconProps) {
  const safeIdx = ((regionId % REGION_GLYPH_IDS.length) + REGION_GLYPH_IDS.length) % REGION_GLYPH_IDS.length;
  const glyphId = REGION_GLYPH_IDS[safeIdx];
  const color = '#4A3B32';

  return (
    <svg
      data-region-glyph={glyphId}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {glyphId === 'paw' && (
        <g fill={color}>
          <circle cx="6.5" cy="8.5" r="2.2" />
          <circle cx="12" cy="6.5" r="2.2" />
          <circle cx="17.5" cy="8.5" r="2.2" />
          <path d="M12 11.2c-3.2 0-5.6 2.4-5.6 4.8 0 1.6 1.3 2.7 3 2.7.9 0 1.7-.3 2.6-.3s1.7.3 2.6.3c1.7 0 3-1.1 3-2.7 0-2.4-2.4-4.8-5.6-4.8Z" />
        </g>
      )}
      {glyphId === 'fish' && (
        <path
          d="M21 12c-2.8-3.8-6.5-5.5-10.5-5.5-2.2 0-4.2.7-5.8 2L2 6v12l2.7-2.5c1.6 1.3 3.6 2 5.8 2 4 0 7.7-1.7 10.5-5.5Zm-4.5-.8a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"
          fill={color}
        />
      )}
      {glyphId === 'yarn' && (
        <g stroke={color} strokeWidth="2.1" strokeLinecap="round">
          <circle cx="12" cy="12" r="7.5" />
          <path d="M6.8 8.5c3.2-.5 6.8 1.2 9.4 4.2M6.2 13.5c3.5-.8 6.8.6 8.8 3.2M9.5 5.2c2.2 2.2 3.2 5.2 2.8 8.6" />
        </g>
      )}
      {glyphId === 'bell' && (
        <path
          d="M12 4a6 6 0 0 0-6 6v3.8L4.2 16a1 1 0 0 0 .8 1.6h14a1 1 0 0 0 .8-1.6L18 13.8V10a6 6 0 0 0-6-6Zm-2.2 15a2.2 2.2 0 0 0 4.4 0H9.8Z"
          fill={color}
        />
      )}
      {glyphId === 'star' && (
        <path
          d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.6Z"
          fill={color}
        />
      )}
      {glyphId === 'moon' && (
        <path
          d="M19.5 15.5A8.2 8.2 0 0 1 8.5 4.5a8.2 8.2 0 1 0 11 11Z"
          fill={color}
        />
      )}
      {glyphId === 'mouse' && (
        <g fill={color}>
          <circle cx="8" cy="7" r="3" />
          <circle cx="16" cy="7" r="3" />
          <path d="M12 8.2c-3.8 0-6.5 3.1-6.5 6.8 0 2.6 2.9 4.5 6.5 4.5s6.5-1.9 6.5-4.5c0-3.7-2.7-6.8-6.5-6.8Z" />
        </g>
      )}
      {glyphId === 'crown' && (
        <path
          d="M3.5 18.5h17l1-10.5-5 4-4.5-6-4.5 6-5-4 1 10.5Z"
          fill={color}
        />
      )}
      {glyphId === 'heart' && (
        <path
          d="M12 20.4s-8-4.7-8-10.6A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8 3.4c0 5.9-8 10.6-8 10.6Z"
          fill={color}
        />
      )}
      {glyphId === 'milk' && (
        <path
          d="M12 3.2C12 3.2 6.2 10 6.2 14.5a5.8 5.8 0 0 0 11.6 0C17.8 10 12 3.2 12 3.2Z"
          fill={color}
        />
      )}
    </svg>
  );
}
