import { useState } from 'preact/hooks';
import { CatVariant, CellState } from '../types/puzzle';
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import { CatSvg } from './CatSvg';

export interface TutorialModalProps {
  catVariant: CatVariant;
  onClose: () => void;
}

export function TutorialModal({ catVariant, onClose }: TutorialModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = TUTORIAL_STEPS[stepIndex];

  const [board, setBoard] = useState<CellState[][]>(() =>
    currentStep.initialBoard.map((row) => [...row])
  );
  const [isStepCompleted, setIsStepCompleted] = useState(false);

  const handleCellClick = (r: number, c: number) => {
    if (r === currentStep.targetCell.row && c === currentStep.targetCell.col) {
      const nextBoard = board.map((row) => [...row]);
      nextBoard[r][c] = currentStep.expectedAction;
      setBoard(nextBoard);
      setIsStepCompleted(true);
    }
  };

  const handleNext = () => {
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setBoard(TUTORIAL_STEPS[nextIdx].initialBoard.map((row) => [...row]));
      setIsStepCompleted(false);
    } else {
      onClose();
    }
  };

  const handleJumpPart = (part: 'basic' | 'advanced') => {
    const idx = TUTORIAL_STEPS.findIndex((s) => s.part === part);
    if (idx !== -1) {
      setStepIndex(idx);
      setBoard(TUTORIAL_STEPS[idx].initialBoard.map((row) => [...row]));
      setIsStepCompleted(false);
    }
  };

  return (
    <div
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
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
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
              1. Básico
            </button>
            <button
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
              2. Avanzado (1–2 saltos)
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

        {/* Mini interactive board */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${currentStep.size}, 1fr)`,
            gridTemplateRows: `repeat(${currentStep.size}, 1fr)`,
            gap: '6px',
            padding: '10px',
            background: '#EFE6D5',
            borderRadius: '16px',
            maxWidth: '240px',
            width: '100%',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {Array.from({ length: currentStep.size }).map((_, r) =>
            Array.from({ length: currentStep.size }).map((_, c) => {
              const regId = currentStep.regions[r][c];
              const cellState = board[r][c];
              const isTarget =
                !isStepCompleted &&
                currentStep.targetCell.row === r &&
                currentStep.targetCell.col === c;

              return (
                <div
                  key={`${r}-${c}`}
                  data-testid={`tutorial-cell-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`board-cell reg-${regId % 9}`}
                  style={{
                    boxShadow: isTarget ? '0 0 0 3px #6366F1' : undefined,
                    cursor: isTarget ? 'pointer' : 'default',
                  }}
                >
                  {cellState === 'cross' && (
                    <svg viewBox="0 0 24 24" className="cross-mark">
                      <line x1="5" y1="5" x2="19" y2="19" />
                      <line x1="19" y1="5" x2="5" y2="19" />
                    </svg>
                  )}
                  {cellState === 'cat' && (
                    <div style={{ width: '80%', height: '80%' }}>
                      <CatSvg variant={catVariant} state="placed" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            fontSize: '12.5px',
            textAlign: 'center',
            color: isStepCompleted ? '#10B981' : '#E07A5F',
            fontWeight: 700,
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
