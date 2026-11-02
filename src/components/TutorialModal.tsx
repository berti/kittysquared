import { useRef, useState } from 'preact/hooks';
import { CatVariant, RegionAssistMode } from '../types/puzzle';
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import { Board } from './Board';
import { HeartSvg } from './Icons';
import { soundEngine } from '../audio/soundEngine';
import {
  applyCellTap,
  applyDragCross,
  createLevelSession,
  LevelSessionState,
} from '../state/gameState';

export interface TutorialModalProps {
  catVariant: CatVariant;
  regionAssist?: RegionAssistMode;
  doubleTapTimeoutMs?: number;
  onClose: () => void;
}

function initSessionForStep(stepIndex: number): LevelSessionState {
  const step = TUTORIAL_STEPS[stepIndex];
  const base = createLevelSession(step.puzzle);
  base.board = step.initialBoard.map((row) => [...row]);
  if (step.initialLockedCats) {
    base.lockedCats = step.initialLockedCats.map((row) => [...row]);
  }
  if (step.initialErrorCrosses) {
    base.errorCrosses = step.initialErrorCrosses.map((row) => [...row]);
  }
  if (step.initialMistakes !== undefined) {
    base.mistakes = step.initialMistakes;
  }
  return base;
}

export function TutorialModal({
  catVariant,
  regionAssist = 'off',
  doubleTapTimeoutMs = 500,
  onClose,
}: TutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = TUTORIAL_STEPS[stepIndex];

  const [session, setSession] = useState<LevelSessionState>(() => initSessionForStep(0));
  const initialSessionRef = useRef<LevelSessionState>(session);

  const isStepCompleted = currentStep.isComplete(session, initialSessionRef.current);

  const handleCellTap = (r: number, c: number, options?: { isDoubleTap?: boolean }) => {
    const prevMistakes = session.mistakes;
    const prevCell = session.board[r][c];

    const next = applyCellTap(session, r, c, options);
    // In tutorial mode, keep status playing to prevent defeat modal overlay
    if (next.status === 'lost') {
      next.status = 'playing';
    }

    setSession(next);

    if (next.mistakes > prevMistakes) {
      soundEngine.playConflict();
    } else if (next.board[r][c] === 'cat' && prevCell !== 'cat') {
      soundEngine.playCatPlaced();
    } else if (next.board[r][c] !== prevCell) {
      soundEngine.playCross();
    }
  };

  const handleDragCross = (r: number, c: number, target: 'cross' | 'empty') => {
    const next = applyDragCross(session, r, c, target);
    setSession(next);
    soundEngine.playCross();
  };

  const handleNext = () => {
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      const nextIdx = stepIndex + 1;
      const nextSession = initSessionForStep(nextIdx);
      setStepIndex(nextIdx);
      setSession(nextSession);
      initialSessionRef.current = nextSession;
    } else {
      onClose();
    }
  };

  const handleJumpPart = (part: 'basic' | 'advanced') => {
    const idx = TUTORIAL_STEPS.findIndex((s) => s.part === part);
    if (idx !== -1) {
      const nextSession = initSessionForStep(idx);
      setStepIndex(idx);
      setSession(nextSession);
      initialSessionRef.current = nextSession;
    }
  };

  const remainingLives = Math.max(0, 3 - session.mistakes);
  const activeHighlights = !isStepCompleted ? currentStep.targetHighlightCells : undefined;

  return (
    <div
      data-testid="tutorial-modal-backdrop"
      class="modal-backdrop-anim"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(61, 49, 53, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        data-testid="tutorial-modal-card"
        class="modal-card-flyin"
        style={{
          backgroundColor: '#FFFBF2',
          border: '4px solid #E2D6C1',
          borderRadius: '24px',
          padding: '24px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-testid="tab-btn-basic"
              onClick={() => handleJumpPart('basic')}
              style={{
                background: currentStep.part === 'basic' ? '#FF9770' : '#EFE6D5',
                color: currentStep.part === 'basic' ? '#FFF' : '#3D3135',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              1. Reglas y Controles
            </button>
            <button
              data-testid="tab-btn-advanced"
              onClick={() => handleJumpPart('advanced')}
              style={{
                background: currentStep.part === 'advanced' ? '#FF9770' : '#EFE6D5',
                color: currentStep.part === 'advanced' ? '#FFF' : '#3D3135',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              2. Estrategias
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#EFE6D5',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#3D3135' }}>
            {currentStep.title}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.45, color: '#7A686E' }}>
            {currentStep.explanation}
          </p>
        </div>

        {/* Hearts display for basic rules steps or when mistake made */}
        {(currentStep.part === 'basic' || session.mistakes > 0) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {Array.from({ length: 3 }).map((_, idx) => (
              <HeartSvg
                key={idx}
                isLost={idx >= remainingLives}
                size={20}
                testId={`tutorial-heart-${idx}`}
              />
            ))}
          </div>
        )}

        {/* Real Interactive Board */}
        <div style={{ maxWidth: '280px', width: '100%', margin: '0 auto' }}>
          <Board
            size={currentStep.size}
            regions={currentStep.puzzle.regions}
            board={session.board}
            lockedCats={session.lockedCats}
            errorCrosses={session.errorCrosses}
            conflictingKeys={session.conflictingKeys}
            lastPlacedCat={session.lastPlacedCat}
            lastErrorCell={session.lastErrorCell}
            isVictory={false}
            catVariant={catVariant}
            regionAssist={regionAssist}
            doubleTapTimeoutMs={doubleTapTimeoutMs}
            highlightCells={activeHighlights}
            onCellTap={handleCellTap}
            onDragCross={handleDragCross}
          />
        </div>

        <div
          style={{
            fontSize: '13px',
            textAlign: 'center',
            color: isStepCompleted ? '#10B981' : '#E07A5F',
            fontWeight: 700,
            minHeight: '20px',
          }}
        >
          {isStepCompleted ? '¡Excelente! Deducción completada.' : currentStep.hintText}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8C7A80', fontWeight: 600 }}>
            Paso {stepIndex + 1} de {TUTORIAL_STEPS.length}
          </span>
          <button
            data-testid="tutorial-next-btn"
            disabled={!isStepCompleted}
            onClick={handleNext}
            style={{
              backgroundColor: isStepCompleted ? '#FF9770' : '#E2D6C1',
              color: '#FFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isStepCompleted ? 'pointer' : 'not-allowed',
            }}
          >
            {stepIndex === TUTORIAL_STEPS.length - 1 ? '¡Listo para jugar! ▶' : 'Siguiente ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
