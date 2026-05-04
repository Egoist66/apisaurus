# API Saurus

Платформа для создания, документирования и тестирования API.

## О проекте

API Saurus — приложение на Next.js 16 для работы с API в одном интерфейсе. В проекте есть редактор OpenAPI, визуальный конструктор, коллекции запросов и встроенный API Tester. Авторизация построена на `Auth.js`, а данные пользователей, проектов и коллекций хранятся в `Postgres` через `Prisma`.

## Основные возможности

- Редактор OpenAPI спецификаций с поддержкой YAML и JSON
- Визуальный конструктор API
- Встроенный API Tester
- Коллекции запросов
- Переменные окружения
- Генерация кода запросов
- Статистика и аналитика
- Темная и светлая тема

## Технологии

- `Next.js 16`
- `TypeScript`
- `Auth.js / NextAuth`
- `Postgres + Prisma`
- `Tailwind CSS`
- `Monaco Editor`
- `OpenAPI 3.0`
- `js-yaml`

## Начало работы

### Установка

```bash
git clone <repo-url>
cd apisaurus
pnpm install
cp .env.example .env
```

Заполните `.env`:

- `DATABASE_URL` — строка подключения к Postgres
- `AUTH_SECRET` — длинный случайный секрет для cookie-сессий Auth.js

### Локальная разработка

Рекомендуемый локальный режим для Windows/macOS:

- поднимать в Docker только `Postgres`;
- сам `Next.js` запускать локально через `pnpm dev`.

Это важно, потому что `next dev` внутри Docker на Windows/macOS часто сильно нагружает файловую систему, память и CPU из-за watch/HMR.

Самый простой локальный вариант:

```bash
pnpm db:up
pnpm prisma:migrate
pnpm dev
```

Если Docker не нужен, можно использовать любой свой локальный или удаленный Postgres и просто указать его в `.env`.

### Запуск приложения в Docker

Для production-подобного запуска в Docker:

```bash
pnpm docker:up
```

Что делает эта команда:

1. поднимает `postgres`;
2. собирает production-образ Next.js;
3. применяет миграции `prisma migrate deploy`;
4. запускает приложение на [http://localhost:3000](http://localhost:3000).

Остановить контейнеры:

```bash
pnpm docker:down
```

Логи приложения:

```bash
pnpm docker:logs
```

### Деплой на Vercel

На Vercel задай переменные окружения:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET` - опционально, если хочешь дублировать секрет в стандартном имени для `next-auth`

В проект уже добавлен `vercel-build`, который делает:

```bash
prisma generate && prisma migrate deploy && next build
```

То есть на деплое Vercel:

1. генерируется Prisma Client;
2. применяются все миграции из `prisma/migrations`;
3. собирается Next.js приложение.

Рекомендуемые настройки проекта в Vercel:

- Framework Preset: `Next.js`
- Install Command: `pnpm install`
- Build Command: `pnpm vercel-build`
- Output Directory: оставить пустым

Рекомендуется:

- использовать отдельную production-базу;
- для preview deploys указать отдельный `DATABASE_URL`, если не хочешь, чтобы preview меняли production-схему.
- если не хочешь, чтобы preview-деплои применяли миграции в общей базе, используй отдельную preview-базу или поменяй Build Command для preview-окружения.

### Быстрый запуск без миграций

Если нужно просто быстро синхронизировать локальную базу со схемой, можно использовать:

```bash
pnpm prisma:push
pnpm dev
```

После этого откройте [http://localhost:3000](http://localhost:3000).

## Использование

1. Зарегистрируйте аккаунт по email и паролю.
2. Создайте проект или коллекцию.
3. Редактируйте OpenAPI-спецификацию через редактор или конструктор.
4. Тестируйте API через встроенный tester.

## Структура проекта

```text
apisaurus/
├── app/
│   ├── api/              # Auth.js, registration, projects, collections, test proxy
│   ├── dashboard/        # Основной интерфейс приложения
│   └── page.tsx          # Экран входа и регистрации
├── auth.ts               # Конфигурация Auth.js
├── components/           # UI-компоненты
├── contexts/             # Theme/Auth providers
├── lib/                  # Prisma client, auth helpers, utilities
├── prisma/               # Prisma schema
├── types/                # TypeScript types
└── package.json
```

## Скрипты

- `pnpm dev` — запуск dev-сервера
- `pnpm build` — production build
- `pnpm start` — запуск production-сервера
- `pnpm prisma:generate` — генерация Prisma Client
- `pnpm prisma:push` — применение схемы к базе без миграций
- `pnpm prisma:migrate` — создание и применение миграций
- `pnpm prisma:deploy` — применение миграций в production
- `pnpm prisma:studio` — Prisma Studio
- `pnpm db:up` — запуск локального Postgres через Docker Compose
- `pnpm db:down` — остановка локального Postgres
- `pnpm db:logs` — логи локального Postgres
- `pnpm docker:up` — production-подобный запуск приложения и Postgres в Docker
- `pnpm docker:down` — остановка Docker-окружения приложения
- `pnpm docker:logs` — логи контейнера приложения

## Документация

Встроенная документация доступна на странице [/docs](http://localhost:3000/docs).

## Лицензия

Открытый проект для личного и коммерческого использования.
