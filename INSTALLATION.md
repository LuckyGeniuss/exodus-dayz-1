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

- **bun** — быстрая альтернатива npm
- **pnpm** — эффективный менеджер пакетов

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

Проект будет доступен по адресу: http://localhost:8080

---

## Детальная установка

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/your-username/exodus-dayz-shop.git
cd exodus-dayz-shop
```

### Шаг 2: Установка зависимостей

**npm:**
```bash
npm install
```

**bun (быстрее):**
```bash
bun install
```

**pnpm:**
```bash
pnpm install
```

### Шаг 3: Проверка установки

```bash
# Проверить версии
node --version  # должно быть 18+
npm --version   # должно быть 9+

# Проверить зависимости
npm list --depth=0
```

---

## Настройка окружения

### Файл .env

Создайте файл `.env` в корне проекта:

```env
# Supabase Configuration (обязательно)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_PROJECT_ID=your-project-id

# Site Configuration (опционально)
VITE_SITE_URL=https://your-domain.com
VITE_SITE_NAME=Exodus DayZ Shop
```

> **Примечание:** При использовании Lovable Cloud переменные окружения настраиваются автоматически.

### Описание переменных

| Переменная | Описание | Обязательно |
|------------|----------|-------------|
| `VITE_SUPABASE_URL` | URL вашего Supabase проекта | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Публичный ключ (anon key) | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | ID проекта | ✅ |
| `VITE_SITE_URL` | URL сайта (для callback'ов) | ❌ |
| `VITE_SITE_NAME` | Название сайта | ❌ |

---

## Настройка базы данных

### Автоматическая настройка (Lovable Cloud)

При использовании Lovable Cloud база данных создаётся и настраивается автоматически:

1. Все таблицы создаются через миграции
2. RLS политики применяются автоматически
3. Edge Functions деплоятся автоматически

### Ручная настройка (Self-hosted Supabase)

1. **Создайте проект** на [supabase.com](https://supabase.com)

2. **Выполните миграции:**
   ```bash
   # Установить Supabase CLI
   npm install -g supabase
   
   # Войти в аккаунт
   supabase login
   
   # Связать проект
   supabase link --project-ref your-project-id
   
   # Выполнить миграции
   supabase db push
   ```

3. **Задеплойте Edge Functions:**
   ```bash
   supabase functions deploy
   ```

### Структура базы данных

База данных содержит 35+ таблиц. Основные:

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей |
| `products` | Товары |
| `orders` | Заказы |
| `order_items` | Позиции заказов |
| `cart_items` | Корзина |
| `balance_transactions` | Транзакции баланса |
| `promo_codes` | Промокоды |
| `achievements` | Достижения |
| `referrals` | Рефералы |

Полная схема: [DATABASE.md](./DATABASE.md)

---

## Настройка API ключей

API ключи настраиваются в админ-панели: **Настройки → API Ключи**

### WayForPay (Карты)

1. Зарегистрируйтесь на [wayforpay.com](https://wayforpay.com)
2. Создайте мерчанта
3. Получите `MERCHANT_LOGIN` и `MERCHANT_SECRET`
4. Добавьте в настройках:
   - `WAYFORPAY_MERCHANT_LOGIN`
   - `WAYFORPAY_MERCHANT_SECRET`

### NOWPayments (Крипто)

1. Зарегистрируйтесь на [nowpayments.io](https://nowpayments.io)
2. Создайте API ключ
3. Добавьте в настройках:
   - `NOWPAYMENTS_API_KEY`

### Resend (Email)

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Верифицируйте домен
3. Создайте API ключ
4. Добавьте в настройках:
   - `RESEND_API_KEY`

### Steam

1. Получите ключ на [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Добавьте в настройках:
   - `STEAM_API_KEY`

### Telegram

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен
3. Добавьте в настройках:
   - `TELEGRAM_BOT_TOKEN`

### Discord

1. Создайте Webhook в настройках канала
2. Скопируйте URL
3. Добавьте в настройках:
   - `DISCORD_WEBHOOK_URL`

---

## Запуск проекта

### Development

```bash
npm run dev
```

Сервер запустится на http://localhost:8080

### Production Build

```bash
# Собрать проект
npm run build

# Предпросмотр сборки
npm run preview
```

### Доступные скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера |
| `npm run build` | Сборка для production |
| `npm run preview` | Предпросмотр сборки |
| `npm run lint` | Проверка кода ESLint |

---

## Деплой

### Lovable (Рекомендуется)

1. Откройте проект в Lovable
2. Нажмите **Share → Publish**
3. Готово! 🎉

### Vercel

```bash
# Установить Vercel CLI
npm i -g vercel

# Задеплоить
vercel
```

### Netlify

1. Подключите GitHub репозиторий
2. Build command: `npm run build`
3. Publish directory: `dist`

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

```bash
docker build -t exodus-shop .
docker run -p 8080:8080 exodus-shop
```

---

## Решение проблем

### Ошибка "Module not found"

```bash
# Очистить кэш и переустановить
rm -rf node_modules package-lock.json
npm install
```

### Ошибка подключения к Supabase

1. Проверьте переменные в `.env`
2. Убедитесь, что URL начинается с `https://`
3. Проверьте, что ключ — это `anon` ключ, а не `service_role`

### Порт 8080 занят

```bash
# Использовать другой порт
npm run dev -- --port 3000
```

### Ошибки TypeScript

```bash
# Проверить типы
npx tsc --noEmit

# Сгенерировать типы Supabase
npx supabase gen types typescript --project-id your-project > src/integrations/supabase/types.ts
```

### Edge Functions не работают

1. Проверьте, что функции задеплоены
2. Проверьте логи в Supabase Dashboard
3. Убедитесь, что все секреты настроены

---

## Следующие шаги

1. 📖 Изучите [FEATURES.md](./FEATURES.md) для понимания функционала
2. 🗄️ Ознакомьтесь с [DATABASE.md](./DATABASE.md) для понимания схемы
3. 🔧 Настройте API ключи в админ-панели
4. 🎨 Кастомизируйте дизайн через `tailwind.config.ts`

---

## Поддержка

- 📚 [Документация](./README.md)
- 🐛 [Сообщить о баге](https://github.com/your-username/exodus-dayz-shop/issues)
- 💬 [Discord сообщество](https://discord.gg/your-server)
