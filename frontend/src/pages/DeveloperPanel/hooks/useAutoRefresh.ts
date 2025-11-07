// frontend/src/pages/DeveloperPanel/hooks/useAutoRefresh.ts

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  enabled: boolean;
  intervalSeconds: number; // в секундах
  onRefresh: () => Promise<void> | void;
  onError?: (error: Error) => void;
  immediate?: boolean; // Выполнить сразу при старте
}

interface UseAutoRefreshReturn {
  isRefreshing: boolean;
  stopAutoRefresh: () => void;
  startAutoRefresh: () => void;
  refreshNow: () => Promise<void>;
}

export const useAutoRefresh = ({
  enabled,
  intervalSeconds,
  onRefresh,
  onError,
  immediate = false,
}: UseAutoRefreshOptions): UseAutoRefreshReturn => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const mountedRef = useRef(true);

  // Функция обновления с защитой от дублирования
  const refreshNow = useCallback(async () => {
    // Если уже идёт обновление, пропустить
    if (isRefreshingRef.current) {
      console.log('🔄 Обновление уже идёт, пропускаем...');
      return;
    }

    // Если компонент размонтирован, не обновлять
    if (!mountedRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      console.log(`🔄 Начинаю обновление (${new Date().toLocaleTimeString()})`);
      await onRefresh();
      console.log(`✅ Обновление завершено (${new Date().toLocaleTimeString()})`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('❌ Ошибка автообновления:', err);
      
      if (onError) {
        onError(err);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onRefresh, onError]);

  // Запуск автообновления
  const startAutoRefresh = useCallback(() => {
    // Очистить предыдущий таймер
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Проверка валидности интервала
    if (intervalSeconds <= 0) {
      console.warn('⚠️ Интервал должен быть > 0');
      return;
    }

    console.log(`🔄 Автообновление запущено: каждые ${intervalSeconds}с`);

    // Выполнить сразу при старте (опционально)
    if (immediate) {
      refreshNow();
    }

    // Установить интервал
    timerRef.current = setInterval(refreshNow, intervalSeconds * 1000);
  }, [intervalSeconds, immediate, refreshNow]);

  // Остановка автообновления
  const stopAutoRefresh = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('🛑 Автообновление остановлено');
    }
  }, []);

  // Эффект управления автообновлением
  useEffect(() => {
    if (enabled && intervalSeconds > 0) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    // Cleanup при размонтировании или изменении зависимостей
    return () => {
      stopAutoRefresh();
    };
  }, [enabled, intervalSeconds, startAutoRefresh, stopAutoRefresh]);

  // Cleanup при размонтировании компонента
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isRefreshing: isRefreshingRef.current,
    stopAutoRefresh,
    startAutoRefresh,
    refreshNow,
  };
};
