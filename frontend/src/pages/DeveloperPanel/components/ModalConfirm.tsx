import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import '../styles/ModalConfirm.css';

type Props = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const MIN_WIDTH = 340;
const MAX_WIDTH = 900;
const INITIAL_WIDTH = 440;

const ModalConfirm: React.FC<Props> = ({ open, title, message, onConfirm, onCancel }) => {
  const [width, setWidth] = useState(INITIAL_WIDTH);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(width);

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const delta = e.clientX - startX.current;
        setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.current + delta)));
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.body.style.cursor = "ew-resize";
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.body.style.cursor = "";
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, open]);

  useEffect(() => {
    if (open) setWidth(INITIAL_WIDTH);
    setIsFullscreen(false);
  }, [open]);

  if (!open) return null;

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const modalStyles = {
    width: isFullscreen ? '90vw' : width,
    maxWidth: "96vw",
    minWidth: MIN_WIDTH,
    borderRadius: 12,
    transition: "width 0.2s cubic-bezier(.4,1.4,.6,1)",
    boxShadow: "0 8px 32px rgba(30,40,90,0.18)",
    background: "#fff",
  } as React.CSSProperties;

  return (
    <div className="modal-confirm__overlay" tabIndex={-1} onClick={onCancel} aria-modal="true" role="dialog">
      <div
        className="modal-confirm__content"
        style={modalStyles}
        onClick={e => e.stopPropagation()}
        aria-labelledby="modal-confirm-title"
        ref={undefined}
      >
        {/* Header */}
        <div className="modal-confirm__header">
          <h2 className="modal-confirm__title" id="modal-confirm-title">{title}</h2>
          <div className="modal-confirm__header-controls">
            <button
              className="modal-confirm__header-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Свернуть' : 'Развернуть'}
              aria-label={isFullscreen ? "Свернуть" : "Развернуть"}
              tabIndex={0}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              className="modal-confirm__header-btn modal-confirm__header-btn--close"
              onClick={onCancel}
              title="Закрыть"
              aria-label="Закрыть"
              tabIndex={0}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-confirm__body">
          <div className="modal-confirm__message">{message}</div>
        </div>

        {/* Footer */}
        <div className="modal-confirm__footer">
          <button
            className="modal-confirm__btn modal-confirm__btn--confirm"
            onClick={onConfirm}
            tabIndex={0}
            autoFocus
          >
            ✓ Подтвердить
          </button>
          <button
            className="modal-confirm__btn modal-confirm__btn--cancel"
            onClick={onCancel}
            tabIndex={0}
          >
            ✕ Отмена
          </button>
        </div>

        {/* Resize Handle (правый край) */}
        {!isFullscreen && (
          <div
            className="modal-confirm__resize-handle modal-confirm__resize-handle--right"
            onMouseDown={e => {
              e.preventDefault();
              setIsDragging(true);
              startX.current = e.clientX;
              startWidth.current = width;
            }}
            title="Изменить ширину"
            tabIndex={0}
            aria-label="Изменить ширину"
          />
        )}

        {/* Size Indicator */}
        {!isFullscreen && (
          <div className="modal-confirm__size-indicator" aria-hidden="true">
            {width}px
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalConfirm;
