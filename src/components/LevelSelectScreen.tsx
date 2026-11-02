import { useEffect, useRef, useState } from 'preact/hooks';
import { getTotalEarnedStars, ModeProgress, StarRating } from '../state/storage';

export interface LevelSelectTier {
  size: number;
  startId: number;
  endId: number;
}

export const LEVEL_SELECT_TIERS: LevelSelectTier[] = [
  { size: 5, startId: 1, endId: 15 },
  { size: 6, startId: 16, endId: 40 },
  { size: 7, startId: 41, endId: 65 },
  { size: 8, startId: 66, endId: 85 },
  { size: 9, startId: 86, endId: 100 },
  { size: 10, startId: 101, endId: 300 },
];

export interface LevelSelectScreenProps {
  progress: ModeProgress;
  totalLevels?: number;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

function getTierForLevelId(levelId: number, totalLevels: number): number {
  const clamped = Math.max(1, Math.min(totalLevels, levelId));
  const found = LEVEL_SELECT_TIERS.find(
    (t) => clamped >= t.startId && clamped <= t.endId
  );
  return found ? found.size : 10;
}

function StarIcon({ filled, size = 10 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path
        fill={filled ? '#FFB703' : '#E2D6C1'}
        stroke={filled ? '#D97706' : '#C9B99F'}
        strokeWidth="2"
        strokeLinejoin="round"
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z"
      />
    </svg>
  );
}

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#9E8D93" />
      <path
        d="M8 11V7a4 4 0 018 0v4"
        fill="none"
        stroke="#9E8D93"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LevelSelectScreen({
  progress,
  totalLevels = 300,
  onSelectLevel,
  onBack,
}: LevelSelectScreenProps) {
  const [selectedTierSize, setSelectedTierSize] = useState<number>(() =>
    getTierForLevelId(progress.currentLevelId, totalLevels)
  );
  const frontierRef = useRef<HTMLButtonElement | null>(null);

  const activeTier =
    LEVEL_SELECT_TIERS.find((t) => t.size === selectedTierSize) || LEVEL_SELECT_TIERS[0];

  const tierEndId = Math.min(activeTier.endId, totalLevels);
  const tierLevelIds: number[] = [];
  for (let id = activeTier.startId; id <= tierEndId; id++) {
    tierLevelIds.push(id);
  }

  const starsMap: Record<number, StarRating> = progress.levelStars || {};
  const totalEarnedStars = getTotalEarnedStars(progress);
  const maxTotalStars = totalLevels * 3;

  const tierEarnedStars = tierLevelIds.reduce((sum, id) => sum + (starsMap[id] || 0), 0);
  const tierMaxStars = tierLevelIds.length * 3;

  useEffect(() => {
    if (
      selectedTierSize === 10 &&
      frontierRef.current &&
      typeof frontierRef.current.scrollIntoView === 'function'
    ) {
      frontierRef.current.scrollIntoView({ block: 'center' });
    }
  }, [selectedTierSize]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '88vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <button
          type="button"
          data-testid="level-select-back-btn"
          onClick={onBack}
          style={{
            background: '#F3E9D2',
            border: '2px solid #E2D6C1',
            boxShadow: '0 2px 0 #E2D6C1',
            borderRadius: '10px',
            padding: '7px 14px',
            fontWeight: 800,
            fontSize: '15px',
            color: '#5C4B51',
            cursor: 'pointer',
          }}
        >
          ← Menú
        </button>

        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '20px', color: '#3D3135' }}>
          Niveles
        </h2>

        <div
          data-testid="level-select-total-stars"
          style={{
            background: '#F3E9D2',
            border: '2px solid #E2D6C1',
            borderRadius: '12px',
            padding: '6px 12px',
            fontWeight: 900,
            fontSize: '14px',
            color: '#3D3135',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <StarIcon filled={true} size={15} />
          <span>
            {totalEarnedStars} / {maxTotalStars}
          </span>
        </div>
      </div>

      {/* Segmented Tier Tab Bar */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: '4px',
          background: '#EFE6D5',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '12px',
        }}
      >
        {LEVEL_SELECT_TIERS.map((tier) => {
          const isActive = tier.size === selectedTierSize;
          return (
            <button
              key={tier.size}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`tier-tab-${tier.size}`}
              onClick={() => setSelectedTierSize(tier.size)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '10px',
                padding: '8px 4px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                background: isActive ? '#FF9770' : 'transparent',
                color: isActive ? '#FFFFFF' : '#7A686E',
                boxShadow: isActive ? '0 2px 0 #D9724C' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tier.size}×{tier.size}
            </button>
          );
        })}
      </div>

      {/* Tier Summary Banner */}
      <div
        data-testid="tier-summary-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F3E9D2',
          border: '2px solid #E2D6C1',
          borderRadius: '14px',
          padding: '10px 14px',
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: 800,
          color: '#3D3135',
        }}
      >
        <span>
          Tableros {activeTier.size}×{activeTier.size} (Niv. {activeTier.startId}–{tierEndId})
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: '#E07A5F',
          }}
        >
          <StarIcon filled={true} size={14} />
          <span>
            {tierEarnedStars} / {tierMaxStars}
          </span>
        </span>
      </div>

      {/* 5-Column Level Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
          }}
        >
          {tierLevelIds.map((id) => {
            const stars = starsMap[id];
            const isCompleted = id < progress.currentLevelId || stars !== undefined;
            const isFrontier = id === progress.currentLevelId && !isCompleted;
            const isLocked = id > progress.currentLevelId && !isCompleted;
            const displayStars: number = stars ?? (isCompleted ? 1 : 0);

            return (
              <button
                key={id}
                ref={isFrontier ? frontierRef : undefined}
                type="button"
                disabled={isLocked}
                data-testid={`level-tile-${id}`}
                onClick={() => {
                  if (!isLocked) {
                    onSelectLevel(id);
                  }
                }}
                style={{
                  background: isFrontier
                    ? '#FF9770'
                    : isCompleted
                    ? '#FFFFFF'
                    : '#EFE6D5',
                  border: '2px solid',
                  borderColor: isFrontier ? '#E07A5F' : '#E2D6C1',
                  boxShadow: isLocked
                    ? 'none'
                    : isFrontier
                    ? '0 3px 0 #D9724C'
                    : '0 3px 0 #E2D6C1',
                  borderRadius: '12px',
                  padding: '8px 4px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  color: isFrontier ? '#FFFFFF' : isLocked ? '#9E8D93' : '#3D3135',
                  opacity: isLocked ? 0.75 : 1,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1.1 }}>
                  {id}
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '12px',
                  }}
                >
                  {isCompleted && (
                    <>
                      <StarIcon filled={displayStars >= 1} size={10} />
                      <StarIcon filled={displayStars >= 2} size={10} />
                      <StarIcon filled={displayStars >= 3} size={10} />
                    </>
                  )}
                  {isFrontier && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        letterSpacing: '0.3px',
                        lineHeight: 1,
                      }}
                    >
                      JUGAR
                    </span>
                  )}
                  {isLocked && <LockIcon size={11} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
