import { useRef } from 'preact/hooks';
import { CatVariant, CellState } from '../types/puzzle';
import { CatSvg } from './CatSvg';

export interface BoardProps {
  size: number;
  regions: number[][];
  board: CellState[][];
  lockedCats: boolean[][];
  errorCrosses?: boolean[][];
  conflictingKeys: Set<string>;
  lastPlacedCat: { row: number; col: number } | null;
  lastErrorCell: { row: number; col: number } | null;
  isVictory: boolean;
  catVariant: CatVariant;
  onCellTap: (row: number, col: number, options?: { isDoubleTap?: boolean }) => void;
  onDragCross: (row: number, col: number, targetState: 'cross' | 'empty') => void;
}

const DOUBLE_TAP_TIMEOUT_MS = 1000;

export function Board({
  size,
  regions,
  board,
  lockedCats,
  errorCrosses,
  conflictingKeys,
  lastPlacedCat,
  lastErrorCell,
  isVictory,
  catVariant,
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
      now - lastTap.time <= DOUBLE_TAP_TIMEOUT_MS
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

            return (
              <div
                key={`${r}-${c}`}
                data-testid={`cell-${r}-${c}`}
                className={`board-cell reg-${regId % 9} ${isConflict ? 'has-conflict' : ''} ${
                  isError ? 'has-error' : ''
                } ${isLocked ? 'is-locked' : ''} ${isErrorCross ? 'has-error-cross' : ''}`}
                onClick={() => handleClick(r, c)}
                onPointerDown={onPDown}
                onPointerEnter={onPEnter}
                {...nativePointerProps}
              >
                {state === 'cross' && (
                  <span className={`cross-mark ${isErrorCross ? 'cross-mark-error' : ''}`}>✕</span>
                )}
                {state === 'cat' && (
                  <div style={{ width: '82%', height: '82%' }}>
                    <CatSvg variant={catVariant} state={catAnim} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
