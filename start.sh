#!/bin/bash
set -euo pipefail

IP="${IP:-10.10.3.58}"
BACKEND_PORT=8000
FRONTEND_PORT=5173
LOG_DIR="logs"
PID_FILE_BACKEND="backend.pid"
PID_FILE_FRONTEND="frontend.pid"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "🚀 Запуск проекта (Backend + Frontend)"
echo "============================================"

# ----- ОЧИСТКА -----
echo "[1/6] Остановка своих процессов..."

kill_pidfile() {
  local pid_file="$1"
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if ps -p "$pid" > /dev/null 2>&1 ; then
      kill -9 "$pid" && echo "  🛑 Остановлен PID $pid ($pid_file)"
    fi
    rm -f "$pid_file"
  fi
}
kill_pidfile "${PID_FILE_BACKEND}"
kill_pidfile "${PID_FILE_FRONTEND}"

kill_by_pattern_in_project() {
  local pattern="$1"
  local pids
  pids=$(pgrep -fa "$pattern" | grep "$PROJECT_ROOT" | awk '{print $1}' || true)
  if [ -n "$pids" ]; then
    for pid in $pids; do
      kill -9 "$pid" && echo "  🛑 Убит $pattern PID $pid"
    done
  fi
}
kill_by_pattern_in_project "uvicorn.*app.main:app"
kill_by_pattern_in_project "vite.*--host"
kill_by_pattern_in_project "npm run dev"

lsof -ti :${BACKEND_PORT} | xargs -r kill -9 || true
lsof -ti :${FRONTEND_PORT} | xargs -r kill -9 || true
rm -f ${PID_FILE_BACKEND} ${PID_FILE_FRONTEND}
sleep 2

echo "[2/6] Очистка кэша и временных файлов..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

if [ -d "frontend" ]; then
  cd frontend
  rm -rf dist .vite .next
  rm -rf .cache *.log .turbo .parcel-cache
  cd ..
fi

mkdir -p ${LOG_DIR}
rm -f ${LOG_DIR}/uvicorn.log ${LOG_DIR}/frontend.log
rm -rf backend/.pytest_cache backend/.mypy_cache

echo "✅ Кэш очищен"

echo "[3/6] Запуск Backend (Python/FastAPI)..."
if [ ! -d "venv" ]; then
  echo "❌ Нет venv! Перед первым запуском установи зависимости."; exit 1;
fi

source venv/bin/activate

export CRYPTOGRAPHY_DONT_BUILD_RUST=1

if [ -d "backend/alembic" ]; then
  echo "  🔄 Применение миграций Alembic..."
  cd backend
  alembic upgrade head || echo "⚠️  Миграции недоступны или не настроены"
  cd ..
fi

echo "  🚀 Backend: http://${IP}:${BACKEND_PORT}"
cd backend
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port ${BACKEND_PORT} \
  > ../${LOG_DIR}/uvicorn.log 2>&1 &
echo $! > ../${PID_FILE_BACKEND}
sleep 3
if ! ps -p $(cat ../${PID_FILE_BACKEND}) > /dev/null; then
  echo "❌ Backend не стартовал!"
  tail ../${LOG_DIR}/uvicorn.log
  exit 1
fi
cd ..

echo "  ⏳ Ожидание готовности Backend..."
for i in {1..30}; do
  if curl -sf http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
    echo "  ✅ Backend готов (попытка $i)"
    break
  fi
  sleep 1
done

echo "[4/6] Запуск Frontend (React/Vite)..."
if [ ! -d "frontend" ]; then
  echo "❌ Нет директории frontend!"; exit 1;
fi
cd frontend

if ! [ -x node_modules/.bin/vite ]; then
  echo "❌ Не найден vite! Необходимо сначала выполнить npm install."
  exit 1
fi

export NODE_OPTIONS="--max-old-space-size=3072"
echo "  🚀 Frontend: http://${IP}:${FRONTEND_PORT}"
nohup npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT} \
  > ../${LOG_DIR}/frontend.log 2>&1 &
echo $! > ../${PID_FILE_FRONTEND}
sleep 3
if ! ps -p $(cat ../${PID_FILE_FRONTEND}) > /dev/null; then
  echo "❌ Frontend не стартовал!"
  tail ../${LOG_DIR}/frontend.log
  exit 1
fi
cd ..

echo "  ⏳ Ожидание готовности Frontend..."
for i in {1..45}; do
  if curl -sf http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
    echo "  ✅ Frontend готов (попытка $i)"
    break
  fi
  sleep 1
done

echo ""
echo "============================================"
echo "✅ Проект запущен!"
echo "============================================"
echo "🔗 Backend:  http://${IP}:${BACKEND_PORT}"
echo "🔗 Frontend: http://${IP}:${FRONTEND_PORT}"
echo ""
echo "📄 Логи:"
echo "   Backend:  tail -f ${LOG_DIR}/uvicorn.log"
echo "   Frontend: tail -f ${LOG_DIR}/frontend.log"
echo ""
echo "🛑 Остановка:"
echo "   kill \$(cat ${PID_FILE_BACKEND}) \$(cat ${PID_FILE_FRONTEND})"
echo "   pkill -9 -f uvicorn ; pkill -9 -f vite"
echo "============================================"

ps aux | grep -E "uvicorn|vite|npm run dev" | grep "$PROJECT_ROOT" | grep -v grep || echo "⚠️  Процессы не найдены"
