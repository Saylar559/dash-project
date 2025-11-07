import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Plus, Minus } from 'lucide-react';
import '../styles/TableModal.css';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  columns: string[];
  title?: string;
  aliasMap?: Record<string, string>;
}

const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  data = [],
  columns = [],
  title = 'Просмотр таблицы',
  aliasMap = {},
}) => {
  const [width, setWidth] = useState(85);
  const [height, setHeight] = useState(70);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    if (!isDraggingWidth && !isDraggingHeight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWidth) {
        const delta = e.clientX - startX;
        setWidth(prev => Math.max(30, Math.min(98, prev + (delta / window.innerWidth) * 100)));
        setStartX(e.clientX);
      }
      if (isDraggingHeight) {
        const delta = e.clientY - startY;
        setHeight(prev => Math.max(30, Math.min(95, prev + (delta / window.innerHeight) * 100)));
        setStartY(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWidth(false);
      setIsDraggingHeight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWidth, isDraggingHeight, startX, startY]);

  if (!isOpen) return null;

  const finalWidth = isFullscreen ? 98 : width;
  const finalHeight = isFullscreen ? 95 : height;

  return (
    <div className="table-modal__overlay" onClick={onClose}>
      <div
        className="table-modal"
        style={{
          width: `${finalWidth}vw`,
          height: `${finalHeight}vh`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="table-modal__header">
          <h2 className="table-modal__title">{title}</h2>
          <div className="table-modal__controls">
            {/* Zoom */}
            <div className="table-modal__zoom-group">
              <button
                className="table-modal__zoom-btn"
                onClick={() => setFontSize(prev => Math.max(9, prev - 1))}
                title="Уменьшить"
              >
                −
              </button>
              <span className="table-modal__zoom-value">{fontSize}px</span>
              <button
                className="table-modal__zoom-btn"
                onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
                title="Увеличить"
              >
                +
              </button>
            </div>

            <div className="table-modal__divider" />

            {/* Buttons */}
            <button
              className="table-modal__btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Свернуть' : 'Развернуть'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              className="table-modal__btn table-modal__btn--close"
              onClick={onClose}
              title="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="table-modal__content" style={{ fontSize: `${fontSize}px` }}>
          <div className="table-modal__table-wrapper">
            <table className="table-modal__table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} className="table-modal__th">
                      {aliasMap[col] || col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((row, idx) => (
                    <tr key={idx} className="table-modal__tr">
                      {columns.map(col => (
                        <td key={`${idx}-${col}`} className="table-modal__td">
                          {row?.[col] !== undefined ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="table-modal__empty">
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Bar */}
        <div className="table-modal__statusbar">
          <span>{data.length} строк • {columns.length} колонок</span>
          <span>{Math.round(finalWidth)}% × {Math.round(finalHeight)}%</span>
        </div>

        {/* Resize Handles */}
        {!isFullscreen && (
          <>
            <div
              className="table-modal__resize-right"
              onMouseDown={e => {
                setIsDraggingWidth(true);
                setStartX(e.clientX);
              }}
            />
            <div
              className="table-modal__resize-bottom"
              onMouseDown={e => {
                setIsDraggingHeight(true);
                setStartY(e.clientY);
              }}
            />
            <div
              className="table-modal__resize-corner"
              onMouseDown={e => {
                setIsDraggingWidth(true);
                setIsDraggingHeight(true);
                setStartX(e.clientX);
                setStartY(e.clientY);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TableModal;
