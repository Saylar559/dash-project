// src/pages/DeveloperPanel/components/Notifications.tsx

import React from 'react';
import { NotificationState } from '../types';

interface Props extends NotificationState {
  onClearError: () => void;
  onClearSuccess: () => void;
}

export const Notifications: React.FC<Props> = ({
  error,
  success,
  onClearError,
  onClearSuccess
}) => {
  if (!error && !success) return null;

  // ✅ ИСПРАВЛЕНИЕ: Извлекаем текст ошибки
  const errorMessage = typeof error === 'string' 
    ? error 
    : error?.message || 'Unknown error';

  return (
    <div className="mx-6 mt-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <span className="text-red-600">❌</span>
          <p className="text-sm text-red-700 flex-1">{errorMessage}</p>
          <button 
            onClick={onClearError}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <span className="text-green-600">✅</span>
          <p className="text-sm text-green-700 flex-1">{success}</p>
          <button 
            onClick={onClearSuccess}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
