import { useRef } from 'preact/hooks';
import { CatVariant, CellState, RegionAssistMode } from '../types/puzzle';
import { CatSvg } from './CatSvg';

export const REGION_GLYPHS = ['🐾', '🐟', '🧶', '🔔', '⭐', '🌙', '🐭', '👑', '💖', '🥛'];

const CAT_CONFETTI_VECTORS = [
  { tx: '-34px', ty: '-30px', rot: '-230deg', color: '#FF8FA3', round: false },
  { tx: '36px', ty: '-28px', rot: '240deg', color: '#FFB703', round: true },
  { tx: '-30px', ty: '32px', rot: '-190deg', color: '#2EC4B6', round: false },
  { tx: '34px', ty: '30px', rot: '250deg', color: '#C77DFF', round: false },
  { tx: '2px', ty: '-40px', rot: '185deg', color: '#80ED99', round: true },
  { tx: '-38px', ty: '-2px', rot: '-220deg', color: '#F3722C', round: false },
];

export interface BoardProps {
  size: number;
  regions: number[][];
  board: CellState[][];
  lockedCats: boolean[][];
  errorCrosses?: boolean[][];
  conflictingKeys: Set<string>;
  lastPlacedCat: { row: number; col: number } | null;
  lastErrorCell: { row: number; col: number } | null;
  autoCrossCells?: { row: number; col: number }[];
  isVictory: boolean;
  catVariant: CatVariant;
  regionAssist?: RegionAssistMode;
  doubleTapTimeoutMs?: number;
  highlightCells?: { row: number; col: number }[];
  onCellTap: (row: number, col: number, options?: { isDoubleTap?: boolean }) => void;
  onDragCross: (row: number, col: number, targetState: 'cross' | 'empty') => void;
}

const DEFAULT_DOUBLE_TAP_TIMEOUT_MS = 500;

export function Board({
  size,
  regions,
  board,
  lockedCats,
  errorCrosses,
  conflictingKeys,
  lastPlacedCat,
  lastErrorCell,
  autoCrossCells,
  isVictory,
  catVariant,
  regionAssist = 'off',
  doubleTapTimeoutMs = DEFAULT_DOUBLE_TAP_TIMEOUT_MS,
  highlightCells,
  onCellTap,
  onDragCross,
}: BoardProps) {
  const isDraggingRef = useRef(false);
  const dragTargetStateRef = useRef<'cross' | 'empty'>('cross');
  const hasDraggedRef = useRef(false);
  const lastTapRef = useRef<{ row: number; col: number; time: number } | null>(null);

  const handlePointerDown = (row: number, col: number, e: PointerEvent) => {
    // Only primary button
    if (e.button !== undefined && e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;

    // Release pointer capture on mobile touch to allow pointerenter on adjacent cells
    const currentTarget = e.currentTarget as HTMLElement | null;
    const target = (e.target as HTMLElement | null) || currentTarget;
    const elToRelease = currentTarget || target;
    if (elToRelease && typeof elToRelease.releasePointerCapture === 'function' && e.pointerId) {
      try {
        elToRelease.releasePointerCapture(e.pointerId);
      } catch (_err) {
        // Ignore if already released
      }
    }

    // Target cross state based on current cell state
    const current = board[row][col];
    dragTargetStateRef.current = current === 'cross' ? 'empty' : 'cross';
  };

  const handlePointerEnter = (row: number, col: number) => {
    if (!isDraggingRef.current) return;
    hasDraggedRef.current = true;
    onDragCross(row, col, dragTargetStateRef.current);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (row: number, col: number) => {
    // If pointer drag occurred across cells, ignore click to prevent double trigger
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;
    let isDoubleTap = false;

    if (
      lastTap &&
      lastTap.row === row &&
      lastTap.col === col &&
      now - lastTap.time <= doubleTapTimeoutMs
    ) {
      isDoubleTap = true;
      // Reset after registering double tap
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { row, col, time: now };
    }

    onCellTap(row, col, { isDoubleTap });
  };

  const containerPointerProps = {
    onpointerup: handlePointerUp,
  };

  const autoCrossKeys =
    autoCrossCells && autoCrossCells.length > 0
      ? new Set(autoCrossCells.map((ac) => `${ac.row},${ac.col}`))
      : null;

  return (
    <div className="board-container" onPointerUp={handlePointerUp} {...containerPointerProps}>
      <div
        className="board-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size }).map((_, r) =>
          Array.from({ length: size }).map((_, c) => {
            const state = board[r][c];
            const regId = regions[r][c];
            const isConflict = conflictingKeys.has(`${r},${c}`);
            const isError = lastErrorCell?.row === r && lastErrorCell?.col === c;
            const isJustPlaced = lastPlacedCat?.row === r && lastPlacedCat?.col === c;
            const isErrorCross = errorCrosses?.[r]?.[c] ?? false;
            const isLocked = (lockedCats[r]?.[c] ?? false) || isErrorCross;
            const isHighlighted = highlightCells?.some((h) => h.row === r && h.col === c) ?? false;
            const isAutoCross = autoCrossKeys ? autoCrossKeys.has(`${r},${c}`) : false;

            let autoCrossDelayMs: number | undefined = undefined;
            if (isAutoCross && lastPlacedCat) {
              const dist = Math.max(Math.abs(r - lastPlacedCat.row), Math.abs(c - lastPlacedCat.col));
              autoCrossDelayMs = dist * 35;
            }

            let catAnim: 'idle' | 'placed' | 'conflict' | 'victory' = 'idle';
            if (isVictory) catAnim = 'victory';
            else if (isConflict) catAnim = 'conflict';
            else if (isJustPlaced) catAnim = 'placed';

            const onPDown = (e: unknown) => handlePointerDown(r, c, e as PointerEvent);
            const onPEnter = () => handlePointerEnter(r, c);

            const nativePointerProps = {
              onpointerdown: onPDown,
              onpointerenter: onPEnter,
            };

            const isVictoryCat = isVictory && state === 'cat';
            const rowDelayMs = Math.min(180, Math.floor(810 / Math.max(1, size - 1)));
            const cellStyle: Record<string, string> = {};
            if (isHighlighted) {
              cellStyle.boxShadow = '0 0 0 3px #6366F1';
            }
            if (isVictoryCat) {
              cellStyle['--cat-wave-delay'] = `${r * rowDelayMs}ms`;
            }

            return (
              <div
                key={`${r}-${c}`}
                data-testid={`cell-${r}-${c}`}
                className={`board-cell reg-${regId} ${isConflict ? 'has-conflict' : ''} ${
                  isError ? 'has-error' : ''
                } ${isLocked ? 'is-locked' : ''} ${isErrorCross ? 'has-error-cross' : ''} ${
                  isVictoryCat ? 'board-cell-victory-glow' : ''
                }`}
                onClick={() => handleClick(r, c)}
                onPointerDown={onPDown}
                onPointerEnter={onPEnter}
                style={Object.keys(cellStyle).length > 0 ? cellStyle : undefined}
                {...nativePointerProps}
              >
                {regionAssist === 'textures' && (
                  <div className={`region-pattern pat-${regId}`} />
                )}
                {regionAssist === 'glyphs' && (
                  <span className="region-glyph-badge">{REGION_GLYPHS[regId]}</span>
                )}
                {regionAssist === 'numbers' && (
                  <span className="region-number-badge">{regId + 1}</span>
                )}
                {state === 'cross' && (
                  <svg
                    viewBox="0 0 24 24"
                    className={`cross-mark ${isErrorCross ? 'cross-mark-error' : ''} ${
                      isAutoCross ? 'cross-wave' : ''
                    }`}
                    style={
                      autoCrossDelayMs !== undefined
                        ? { animationDelay: `${autoCrossDelayMs}ms` }
                        : undefined
                    }
                  >
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </svg>
                )}
                {state === 'cat' && (
                  <>
                    {isVictoryCat && (
                      <div
                        data-testid={`cat-confetti-${r}-${c}`}
                        className="cat-confetti-burst"
                      >
                        {CAT_CONFETTI_VECTORS.map((vec, i) => (
                          <span
                            key={i}
                            className="cat-confetti-piece"
                            style={{
                              background: vec.color,
                              borderRadius: vec.round ? '50%' : '2px',
                              '--tx': vec.tx,
                              '--ty': vec.ty,
                              '--rot': vec.rot,
                              '--delay': `${r * rowDelayMs + 20}ms`,
                            } as Record<string, string>}
                          />
                        ))}
                      </div>
                    )}
                    <div className="board-cat-wrapper">
                      <CatSvg variant={catVariant} state={catAnim} />
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
