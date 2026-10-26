import { useMemo } from 'preact/hooks';
import { CatAnimState, CatVariant } from '../types/puzzle';

export interface CatSvgProps {
  variant: CatVariant;
  state: CatAnimState;
}

export function CatSvg({ variant, state }: CatSvgProps) {
  const { blinkDelay, blinkDuration } = useMemo(() => {
    // Generate randomized independent timing per cat instance
    const delay = (Math.random() * 4 + 1).toFixed(2);
    const duration = (Math.random() * 5 + 3.5).toFixed(2);
    return {
      blinkDelay: `${delay}s`,
      blinkDuration: `${duration}s`,
    };
  }, []);

  const isBlack = variant === 'black';

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
      <g filter="drop-shadow(0 2px 2px rgba(0,0,0,0.22))">
        {/* Head with pointy ears */}
        <path
          data-cat-part="head"
          d="M7 22 L6 6 L18 14 Q24 12.5 30 14 L42 6 L41 22 C43 32 36 39 24 39 C12 39 5 32 7 22 Z"
          fill={isBlack ? '#1F1B24' : '#FFFFFF'}
          stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
          strokeWidth={isBlack ? 2.2 : 2.4}
          strokeLinejoin="round"
        />

        {/* Ears detail */}
        <g data-cat-part="ears">
          {isBlack ? (
            <>
              <polygon points="9.5,10.5 9,18 15.5,15" fill="#FF8FA3" />
              <polygon points="38.5,10.5 39,18 32.5,15" fill="#FF8FA3" />
            </>
          ) : (
            <>
              <path d="M7 18 L6 6 L16 13 Z" fill="#1F1B24" />
              <path d="M41 18 L42 6 L32 13 Z" fill="#1F1B24" />
            </>
          )}
        </g>

        {/* 4 Whiskers */}
        <line
          data-cat-part="whisker"
          x1={isBlack ? 3 : 4}
          y1="26"
          x2={isBlack ? 9.5 : 10}
          y2="27"
          stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
          strokeWidth={isBlack ? 1.6 : 1.7}
          strokeLinecap="round"
        />
        <line
          data-cat-part="whisker"
          x1={isBlack ? 3.5 : 4.5}
          y1="30"
          x2={isBlack ? 9.5 : 10}
          y2="29.5"
          stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
          strokeWidth={isBlack ? 1.6 : 1.7}
          strokeLinecap="round"
        />
        <line
          data-cat-part="whisker"
          x1={isBlack ? 45 : 44}
          y1="26"
          x2={isBlack ? 38.5 : 38}
          y2="27"
          stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
          strokeWidth={isBlack ? 1.6 : 1.7}
          strokeLinecap="round"
        />
        <line
          data-cat-part="whisker"
          x1={isBlack ? 44.5 : 43.5}
          y1="30"
          x2={isBlack ? 38.5 : 38}
          y2="29.5"
          stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
          strokeWidth={isBlack ? 1.6 : 1.7}
          strokeLinecap="round"
        />

        {/* Nose */}
        <polygon
          data-cat-part="nose"
          points="24,29.5 21.8,27.2 26.2,27.2"
          fill={isBlack ? '#FF8FA3' : '#FF7597'}
        />

        {/* Dynamic Expressions based on state */}
        {state === 'idle' && (
          <>
            <g className="cat-eyes-blink">
              {isBlack ? (
                <>
                  <circle cx="16.5" cy="24.5" r="5.1" fill="#FFFFFF" />
                  <circle cx="17.2" cy="24.5" r="3" fill="#1F1B24" />
                  <circle cx="15.8" cy="23" r="1.3" fill="#FFFFFF" />
                  <circle cx="31.5" cy="24.5" r="5.1" fill="#FFFFFF" />
                  <circle cx="30.8" cy="24.5" r="3" fill="#1F1B24" />
                  <circle cx="29.8" cy="23" r="1.3" fill="#FFFFFF" />
                </>
              ) : (
                <>
                  <circle cx="16.5" cy="24.5" r="4.7" fill="#1F1B24" />
                  <circle cx="15.2" cy="23" r="1.6" fill="#FFFFFF" />
                  <circle cx="18" cy="26" r="0.8" fill="#FFFFFF" />
                  <circle cx="31.5" cy="24.5" r="4.7" fill="#1F1B24" />
                  <circle cx="30.2" cy="23" r="1.6" fill="#FFFFFF" />
                  <circle cx="33" cy="26" r="0.8" fill="#FFFFFF" />
                </>
              )}
            </g>
            <path
              d="M20.2 31.2 Q22.1 33.2 24 31 Q25.9 33.2 27.8 31.2"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={isBlack ? 1.6 : 1.8}
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'placed' && (
          <>
            {/* Happy arch eyes */}
            <path
              d="M12.5 25 Q16.5 20.5 20.5 25"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={isBlack ? 2.5 : 2.6}
              strokeLinecap="round"
            />
            <path
              d="M27.5 25 Q31.5 20.5 35.5 25"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={isBlack ? 2.5 : 2.6}
              strokeLinecap="round"
            />
            {/* Smile under W mouth */}
            <path
              d="M20 31 Q22 33.2 24 31.2 Q26 33.2 28 31"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'conflict' && (
          <>
            {/* Startled > < eyes */}
            <path
              d="M13 21.5 L19 24.5 L13 27.5"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M35 21.5 L29 24.5 L35 27.5"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Wavy mouth */}
            <path
              d="M20 33 Q22 31 24 33 Q26 35 28 33"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={1.7}
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'victory' && (
          <>
            {/* Blush cheeks */}
            <ellipse cx="13.5" cy="28" rx="2.8" ry="1.6" fill="#FF7597" />
            <ellipse cx="34.5" cy="28" rx="2.8" ry="1.6" fill="#FF7597" />
            {/* Joyful eyes */}
            <path
              d="M12.5 24.5 Q16.5 19.5 20.5 24.5"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={isBlack ? 2.5 : 2.6}
              strokeLinecap="round"
            />
            <path
              d="M27.5 24.5 Q31.5 19.5 35.5 24.5"
              fill="none"
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={isBlack ? 2.5 : 2.6}
              strokeLinecap="round"
            />
            {/* Open smile */}
            <path
              d="M20.5 31.2 Q24 36.2 27.5 31.2 Z"
              fill={isBlack ? '#FF8FA3' : '#FF7597'}
              stroke={isBlack ? '#FFFFFF' : '#1F1B24'}
              strokeWidth={1.4}
            />
          </>
        )}
      </g>
    </svg>
  );
}
