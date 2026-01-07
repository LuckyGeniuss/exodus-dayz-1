<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase"/>
</p>

# 🎮 Exodus DayZ Shop

> Современный интернет-магазин для игровых серверов DayZ с полной системой управления, платежами и интеграциями.

---

## 📋 Содержание

- [✨ Особенности](#-особенности)
- [🚀 Быстрый старт](#-быстрый-старт)
- [📦 Установка](#-установка)
- [⚙️ Конфигурация](#️-конфигурация)
- [🏗️ Архитектура](#️-архитектура)
- [📚 Документация](#-документация)
- [🤝 Вклад в проект](#-вклад-в-проект)
- [📄 Лицензия](#-лицензия)

---

## ✨ Особенности

### 🛒 Магазин
- **Каталог товаров** с фильтрацией, поиском и сортировкой
- **Корзина** с синхронизацией для гостей и пользователей
- **Список желаний** и сравнение товаров
- **Система баланса** с пополнением через различные методы оплаты
- **История заказов** с отслеживанием статуса
- **Отзывы и рейтинги** товаров

### 👤 Пользователь
- **Профиль** с настройками и статистикой
- **Steam интеграция** для привязки аккаунта
- **Telegram интеграция** для уведомлений
- **Discord интеграция** для связи
- **Ежедневные награды** и колесо фортуны
- **Система достижений** с наградами
- **Реферальная программа** с уровнями
- **Система лояльности** с кэшбеком

### 💳 Платежи
- **WayForPay** — карты, Apple Pay, Google Pay
- **NOWPayments** — криптовалюта (USDT)
- **Баланс** — оплата с внутреннего счета
- **Промокоды** с различными условиями
- **Flash-распродажи** с таймером

### 🔧 Администрирование
- **Дашборд** с аналитикой и статистикой
- **Управление товарами** (CRUD, изображения, инвентарь)
- **Управление заказами** с обновлением статусов
- **Управление пользователями** (баны, роли, баланс)
- **Промокоды и акции** с гибкими настройками
- **Email-кампании** и рассылки
- **Тикеты поддержки** с чатом
- **A/B тестирование** для оптимизации
- **Аудит-логи** всех действий
- **Cron-задачи** для автоматизации

### 📱 Технологии
- **PWA** — установка как приложение
- **Адаптивный дизайн** для всех устройств
- **Тёмная/светлая тема** с переключением
- **Real-time обновления** через WebSocket
- **SEO оптимизация** с мета-тегами

---

## 🚀 Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/exodus-dayz-shop.git

# Перейти в директорию
cd exodus-dayz-shop

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Откройте [http://localhost:8080](http://localhost:8080) в браузере.

---

## 📦 Установка

### Требования

- **Node.js** 18.0 или выше
- **npm** 9.0 или выше (или **bun**)

### Шаги установки

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/your-username/exodus-dayz-shop.git
   cd exodus-dayz-shop
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   
   Создайте файл `.env` в корне проекта (или используйте автоматически сгенерированный):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

4. **Запустите проект:**
   ```bash
   npm run dev
   ```

Подробная инструкция: [INSTALLATION.md](./INSTALLATION.md)

---

## ⚙️ Конфигурация

### API Ключи (Admin Settings)

| Ключ | Описание | Обязательный |
|------|----------|--------------|
| `WAYFORPAY_MERCHANT_LOGIN` | Логин мерчанта WayForPay | Для карт |
| `WAYFORPAY_MERCHANT_SECRET` | Секретный ключ WayForPay | Для карт |
| `NOWPAYMENTS_API_KEY` | API ключ NOWPayments | Для крипто |
| `RESEND_API_KEY` | API ключ Resend | Для email |
| `STEAM_API_KEY` | Steam Web API Key | Для Steam |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | Для Telegram |
| `DISCORD_WEBHOOK_URL` | Discord Webhook URL | Для Discord |

Все ключи настраиваются через админ-панель: **Настройки → API Ключи**

---

## 🏗️ Архитектура

```
exodus-dayz-shop/
├── src/
│   ├── components/        # React компоненты
│   │   ├── admin/         # Компоненты админ-панели
│   │   ├── auth/          # Компоненты авторизации
│   │   ├── cart/          # Корзина
│   │   └── ui/            # UI библиотека (shadcn)
│   ├── hooks/             # Кастомные хуки
│   ├── pages/             # Страницы приложения
│   ├── contexts/          # React контексты
│   ├── data/              # Статические данные
│   ├── integrations/      # Интеграции (Supabase)
│   └── lib/               # Утилиты
├── supabase/
│   ├── functions/         # Edge Functions (19 функций)
│   └── migrations/        # Миграции БД
├── public/                # Статические файлы
└── docs/                  # Документация
```

### Технологический стек

| Категория | Технология |
|-----------|------------|
| Frontend | React 18.3, TypeScript 5.8 |
| Сборка | Vite 5.4 |
| Стили | Tailwind CSS 3.4 |
| UI | shadcn/ui, Radix UI |
| Роутинг | React Router 6.30 |
| Состояние | TanStack Query 5.83 |
| Формы | React Hook Form, Zod |
| Графики | Recharts 2.15 |
| Backend | Supabase (PostgreSQL) |
| Functions | Deno (Edge Functions) |

---

## 📚 Документация

| Документ | Описание |
|----------|----------|
| [FEATURES.md](./FEATURES.md) | Полное описание функционала |
| [INSTALLATION.md](./INSTALLATION.md) | Детальная инструкция установки |
| [DATABASE.md](./DATABASE.md) | Схема базы данных |
| [API.md](./API.md) | Документация Edge Functions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектура проекта |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Руководство для контрибьюторов |
| [CHANGELOG.md](./CHANGELOG.md) | История изменений |

---

## 📊 Статистика проекта

| Метрика | Значение |
|---------|----------|
| Страницы | 17 |
| Компоненты | 65+ |
| Таблицы БД | 35+ |
| Edge Functions | 19 |
| Кастомные хуки | 25 |
| Методы оплаты | 5 |

---

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! См. [CONTRIBUTING.md](./CONTRIBUTING.md) для деталей.

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Этот проект лицензирован под MIT License — см. файл [LICENSE](./LICENSE) для деталей.

---

<p align="center">
  Сделано с ❤️ для сообщества DayZ
</p>
