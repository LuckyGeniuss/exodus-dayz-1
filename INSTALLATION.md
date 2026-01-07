# 📦 Руководство по установке

Подробная инструкция по установке и настройке Exodus DayZ Shop.

---

## 📑 Содержание

- [Требования](#требования)
- [Быстрая установка](#быстрая-установка)
- [Детальная установка](#детальная-установка)
- [Настройка окружения](#настройка-окружения)
- [Настройка базы данных](#настройка-базы-данных)
- [Настройка API ключей](#настройка-api-ключей)
- [Запуск проекта](#запуск-проекта)
- [Docker](#docker)
- [Тестирование](#тестирование)
- [Деплой](#деплой)
- [Решение проблем](#решение-проблем)

---

## Требования

### Системные требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| **Node.js** | 18.0+ | 20.0+ |
| **npm** | 9.0+ | 10.0+ |
| **RAM** | 2 GB | 4 GB |
| **Диск** | 500 MB | 1 GB |

### Альтернативные пакетные менеджеры

```bash
# bun (быстрее)
bun install && bun run dev

# pnpm (эффективнее)
pnpm install && pnpm run dev
```

---

## Быстрая установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/exodus-dayz-shop.git

# 2. Перейти в директорию
cd exodus-dayz-shop

# 3. Установить зависимости
npm install

# 4. Запустить dev-сервер
npm run dev
```

Проект будет доступен: http://localhost:8080

---

## Детальная установка

### Шаг 1: Клонирование

```bash
git clone https://github.com/your-username/exodus-dayz-shop.git
cd exodus-dayz-shop
```

### Шаг 2: Установка зависимостей

```bash
npm install
```

<details>
<summary>📦 Основные зависимости</summary>

| Пакет | Версия | Назначение |
|-------|--------|------------|
| react | 18.3 | UI библиотека |
| react-router-dom | 6.30 | Роутинг |
| @tanstack/react-query | 5.83 | Управление состоянием |
| @supabase/supabase-js | 2.58 | Supabase клиент |
| tailwindcss | 3.4 | CSS фреймворк |
| zod | 3.25 | Валидация |
| react-hook-form | 7.61 | Формы |
| recharts | 2.15 | Графики |
| lucide-react | 0.462 | Иконки |

</details>

### Шаг 3: Проверка установки

```bash
# Проверить версии
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# Проверить зависимости
npm list --depth=0

# Проверить типы
npx tsc --noEmit
```

---

## Настройка окружения

### Переменные окружения

Файл `.env` создаётся автоматически при использовании Lovable Cloud:

```env
# Supabase (обязательно)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_PROJECT_ID=your-project-id

# Опционально
VITE_SITE_URL=https://your-domain.com
VITE_SITE_NAME=Exodus DayZ Shop
```

### Описание переменных

| Переменная | Описание | Обязательно |
|------------|----------|-------------|
| `VITE_SUPABASE_URL` | URL Supabase проекта | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon Key | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | Project ID | ✅ |
| `VITE_SITE_URL` | URL сайта | ❌ |

> **Примечание:** При использовании Lovable Cloud переменные настраиваются автоматически.

---

## Настройка базы данных

### Автоматическая (Lovable Cloud)

При использовании Lovable Cloud:
- ✅ Все таблицы создаются автоматически
- ✅ RLS политики применяются
- ✅ Edge Functions деплоятся
- ✅ Миграции выполняются

### Ручная (Self-hosted)

```bash
# Установить Supabase CLI
npm install -g supabase

# Войти
supabase login

# Связать проект
supabase link --project-ref your-project-id

# Выполнить миграции
supabase db push

# Задеплоить Edge Functions
supabase functions deploy --all
```

### Структура БД

База содержит **48 таблиц**:

<details>
<summary>Посмотреть все таблицы</summary>

**Основные:**
- `profiles` — Профили пользователей
- `products` — Товары
- `user_roles` — Роли пользователей
- `loyalty_levels` — Уровни лояльности

**Заказы:**
- `orders` — Заказы
- `order_items` — Позиции заказов
- `cart_items` — Корзина

**Платежи:**
- `balance_transactions` — Транзакции
- `promo_codes` — Промокоды
- `promo_code_uses` — Использования промокодов

**Геймификация:**
- `achievements` — Достижения
- `user_achievements` — Полученные достижения
- `referrals` — Рефералы
- `daily_rewards` — Ежедневные награды
- `fortune_wheel_spins` — Спины колеса
- `wishlist` — Избранное
- `reviews` — Отзывы
- `price_alerts` — Алерты цен

**Коммуникации:**
- `notifications` — Уведомления
- `support_tickets` — Тикеты
- `ticket_messages` — Сообщения
- `broadcast_messages` — Рассылки
- `news_posts` — Новости
- `telegram_users` — Telegram привязки
- `push_subscriptions` — Push подписки

**Аналитика:**
- `product_views` — Просмотры
- `product_clicks` — Клики
- `viewed_products` — История просмотров
- `price_history` — История цен

**Админ:**
- `admin_settings` — Настройки
- `admin_audit_logs` — Аудит логи
- `cron_jobs` — Cron задачи
- `ab_tests` — A/B тесты
- `ab_test_results` — Результаты тестов

</details>

Полная схема: [DATABASE.md](./DATABASE.md)

---

## Настройка API ключей

API ключи настраиваются в **Админ-панели → Настройки → API Ключи**

### Платёжные системы

#### WayForPay (Карты)

1. Регистрация: [wayforpay.com](https://wayforpay.com)
2. Создайте мерчанта
3. Получите ключи
4. Добавьте:
   - `WAYFORPAY_MERCHANT_LOGIN`
   - `WAYFORPAY_MERCHANT_SECRET`

#### NOWPayments (Крипто)

1. Регистрация: [nowpayments.io](https://nowpayments.io)
2. Создайте API Key
3. Добавьте:
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`

### Интеграции

#### Steam

1. Получите ключ: [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Добавьте: `STEAM_API_KEY`

#### Telegram

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен
3. Добавьте: `TELEGRAM_BOT_TOKEN`
4. Настройте webhook в админке

#### Discord

1. Создайте Webhook в канале Discord
2. Добавьте: `DISCORD_WEBHOOK_URL`

#### Email (Resend)

1. Регистрация: [resend.com](https://resend.com)
2. Верифицируйте домен
3. Создайте API Key
4. Добавьте: `RESEND_API_KEY`

---

## Запуск проекта

### Development

```bash
npm run dev
```

Сервер: http://localhost:8080

### Production

```bash
# Сборка
npm run build

# Предпросмотр
npm run preview
```

### Доступные скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер с HMR |
| `npm run build` | Production сборка |
| `npm run preview` | Предпросмотр сборки |
| `npm run lint` | ESLint проверка |
| `npm run test` | Запуск тестов |
| `npm run test:coverage` | Тесты + coverage |

---

## Docker

### Быстрый старт

```bash
# Собрать и запустить
docker-compose up -d app

# Просмотр логов
docker-compose logs -f app

# Остановить
docker-compose down
```

### Development в Docker

```bash
docker-compose --profile dev up dev
```

### Команды Docker

```bash
# Rebuild
docker-compose up -d --build

# Очистка
docker system prune -a

# Проверка здоровья
docker-compose ps
```

### Переменные окружения

Создайте `.env` файл:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
```

---

## Тестирование

### Запуск тестов

```bash
# Все тесты
npm run test

# С coverage
npm run test:coverage

# Watch режим
npm run test -- --watch

# Конкретный файл
npm run test -- src/lib/utils.test.ts
```

### Структура тестов

```
src/
├── test/
│   ├── setup.ts          # Настройка тестов
│   └── test-utils.tsx    # Утилиты
├── lib/
│   └── utils.test.ts     # Unit тесты
├── hooks/
│   └── useCart.test.ts   # Тесты хуков
└── components/
    └── ui/
        ├── button.test.tsx
        └── badge.test.tsx
```

### Coverage

После запуска `npm run test:coverage`:
- HTML отчёт: `coverage/index.html`
- Пороги: 50% statements/branches/functions/lines

---

## Деплой

### Lovable (Рекомендуется)

1. Откройте проект в Lovable
2. **Share → Publish**
3. Готово! 🎉

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

- Build: `npm run build`
- Publish: `dist`

### Docker

```bash
docker build -t exodus-shop .
docker run -p 80:80 exodus-shop
```

Подробнее: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Решение проблем

### "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Ошибка Supabase

1. Проверьте `.env`
2. URL должен начинаться с `https://`
3. Используйте `anon` ключ, не `service_role`

### Порт занят

```bash
npm run dev -- --port 3000
```

### TypeScript ошибки

```bash
npx tsc --noEmit
```

### Edge Functions не работают

1. Проверьте деплой функций
2. Проверьте логи в Cloud
3. Проверьте секреты

### Тесты падают

```bash
# Очистить кэш
npm run test -- --clearCache

# Переустановить
rm -rf node_modules && npm install
```

---

## Следующие шаги

1. 📖 Изучите [FEATURES.md](./FEATURES.md)
2. 🗄️ Ознакомьтесь с [DATABASE.md](./DATABASE.md)
3. 🔌 Настройте API в [API.md](./API.md)
4. 🚀 Задеплойте по [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Поддержка

- 📚 [Документация](./README.md)
- 🐛 [Issues](https://github.com/your-username/exodus-dayz-shop/issues)
- 💬 [Discussions](https://github.com/your-username/exodus-dayz-shop/discussions)
