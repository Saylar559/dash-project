# Escrow Dashboard

Система управления дашбордами с ролевым доступом.

## Технологии

**Backend:**
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Monaco Editor

## Быстрый старт

Запуск всех сервисов
docker-compose up --build

Frontend: http://localhost:5173
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs
text

## Учетные данные по умолчанию

- **Username:** admin
- **Password:** admin123

## Роли

1. **Администратор** - управление пользователями
2. **Разработчик** - создание дашбордов и SQL запросов
3. **Пользователь Дашбордов** - просмотр опубликованных дашбордов
4. **Бухгалтер** - заглушка для будущего функционала
5. **Юзер** - базовая роль

## Структура проекта

escrow-dashboard/
├── backend/ # FastAPI приложение
│ └── app/
│ ├── api/ # API endpoints
│ ├── auth/ # Аутентификация и авторизация
│ ├── models/ # SQLAlchemy модели
│ └── schemas/ # Pydantic схемы
└── frontend/ # React приложение
└── src/
├── components/
├── pages/
├── hooks/
└── services/

text

## Автоматическое обновление токенов

Токены обновляются автоматически каждые 24 часа через axios interceptor.