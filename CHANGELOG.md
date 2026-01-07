# 📝 История изменений

Все значимые изменения в проекте документируются здесь.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

---

## [Unreleased]

### Planned
- [ ] Мультиязычность (i18n) — украинский, английский, русский
- [ ] Конвертация валют (UAH ↔ USD ↔ EUR)
- [ ] Расширенная аналитика с графиками
- [ ] Мобильное приложение (React Native)
- [ ] Интеграция с Google Analytics 4
- [ ] Система кешбека партнёров

---

## [1.5.0] - 2026-01-07

### 🧪 Тестирование и Docker

#### Добавлено
- **Docker конфигурация**
  - Multi-stage Dockerfile для production
  - Dockerfile.dev для разработки
  - docker-compose.yml с сервисами app и dev
  - nginx.conf с оптимальными настройками
  - .dockerignore для оптимизации сборки

- **Vitest тестирование**
  - Конфигурация vitest.config.ts
  - Setup файл с моками (matchMedia, IntersectionObserver, etc.)
  - Test utilities с renderWithProviders
  - Тесты для компонентов UI (Button, Badge)
  - Тесты для хуков (useCart)
  - Тесты для утилит (cn)

- **CI/CD улучшения**
  - Интеграция тестов в GitHub Actions
  - Coverage отчёты в Codecov
  - TypeScript проверка в CI

#### Изменено
- Обновлён .github/workflows/ci.yml с шагами тестирования

---

## [1.4.0] - 2026-01-06

### 📚 Документация

#### Добавлено
- **README.md** — полная презентация проекта
  - Бейджи статуса и технологий
  - Статистика проекта
  - Структура репозитория
  - Quick start guide

- **INSTALLATION.md** — детальная инструкция установки
  - Системные требования
  - Пошаговая установка
  - Настройка переменных окружения
  - Инструкции для Docker
  - Troubleshooting

- **FEATURES.md** — описание всех возможностей
  - Публичная часть сайта
  - Личный кабинет пользователя
  - Система геймификации
  - Админ-панель

- **DATABASE.md** — схема базы данных
  - ER-диаграмма (Mermaid)
  - Описание всех 48 таблиц
  - Функции и триггеры
  - RLS политики
  - Примеры запросов

- **API.md** — документация Edge Functions
  - Все 19 функций с примерами
  - Аутентификация и роли
  - Обработка ошибок
  - Rate limiting

- **ARCHITECTURE.md** — архитектура проекта

- **DEPLOYMENT.md** — инструкции деплоя

- **CONTRIBUTING.md** — гайд для контрибьюторов

#### Изменено
- Обновлён scripts/database-dump.sql с актуальной схемой

---

## [1.3.0] - 2026-01-05

### 🛡️ Безопасность и мониторинг

#### Добавлено
- **Rate Limiting**
  - Таблица rate_limit_log
  - Функция check_rate_limit()
  - Применение в Edge Functions

- **Аудит логи**
  - Таблица admin_audit_logs
  - Логирование всех действий админов
  - Компонент AuditLogs в админке

- **Edge Function Logs**
  - Таблица edge_function_logs
  - Логирование всех вызовов функций
  - Метрики производительности

- **Мониторинг**
  - Компонент MonitoringDashboard
  - Статистика Edge Functions
  - Метрики базы данных

#### Безопасность
- RLS политики для всех новых таблиц
- Валидация входных данных через Zod
- Проверка подписей webhooks

---

## [1.2.0] - 2026-01-04

### 🎮 Геймификация

#### Добавлено
- **Ежедневные награды**
  - Таблица daily_rewards
  - Функции claim_daily_bonus(), calculate_daily_bonus()
  - Серия дней (1-7) с растущими бонусами
  - Компонент DailyRewardModal
  - Хук useDailyReward

- **Колесо фортуны**
  - Таблица fortune_wheel_spins
  - Функции spin_fortune_wheel(), can_spin_fortune_wheel()
  - Призы: баланс (5-100₴), скидки (10-20%)
  - Компонент FortuneWheel с анимацией
  - Ограничение: 1 спин в 7 дней

- **Достижения**
  - Таблицы achievements, user_achievements
  - Триггер notify_achievement_unlock
  - Компонент AchievementsModal
  - Хук useAchievements

- **Реферальная программа**
  - Таблица referrals
  - Триггеры process_referral_bonus
  - Компонент ReferralCard
  - Хук useReferral
  - Бонус 50₴ обоим

- **Программа лояльности**
  - Таблица loyalty_levels
  - 5 уровней: Bronze → Diamond
  - Компонент LoyaltyCard
  - Хук useLoyalty

- **Купоны на день рождения**
  - Таблица birthday_coupons
  - Триггер generate_birthday_promo
  - Персональная скидка 20%

---

## [1.1.0] - 2026-01-03

### 💳 Платежи и уведомления

#### Добавлено
- **WayForPay интеграция**
  - Edge Function wayforpay-payment
  - Обработка webhooks
  - Проверка подписи HMAC-MD5

- **NOWPayments интеграция**
  - Edge Function nowpayments-payment
  - Поддержка криптовалют
  - IPN обработка

- **Система баланса**
  - Таблица balance_transactions
  - Функции deduct_balance(), safe_deduct_balance()
  - Компонент BalanceHistory
  - Страница Balance

- **Промокоды**
  - Таблицы promo_codes, promo_code_uses
  - Триггер notify_promo_code_use
  - Компонент PromoCodeInput
  - Хук usePromoCode

- **Flash-распродажи**
  - Таблицы flash_sales, promotions
  - Компоненты FlashSaleBanner, FlashSaleBadge
  - Хук usePromotions

- **Email уведомления**
  - Интеграция с Resend
  - Edge Functions: send-order-email, send-status-email, send-welcome-email
  - Шаблоны писем

- **Telegram бот**
  - Edge Functions: telegram-bot, telegram-notify
  - Команды: /start, /link, /balance, /orders
  - Привязка аккаунта

- **Push уведомления**
  - Таблица push_subscriptions
  - Edge Function send-push-notification
  - PWA поддержка
  - Компонент PushNotificationSettings

- **Discord webhooks**
  - Edge Function discord-notify
  - Уведомления о заказах

---

## [1.0.0] - 2026-01-01

### 🎉 Первый релиз

Полнофункциональный интернет-магазин для DayZ серверов.

#### Добавлено

##### Магазин
- Каталог товаров с 5 категориями
- Карточки товаров с изображениями
- Фильтрация по категориям
- Поиск с автодополнением
- Сортировка (цена, название, дата)
- Корзина покупок (localStorage + DB)
- Список желаний
- Сравнение товаров (до 4)
- Отзывы и рейтинги
- История цен (графики)
- Алерты о снижении цены
- Недавно просмотренные товары
- Рекомендации товаров

##### Пользователи
- Регистрация email/пароль
- Авторизация с auto-confirm
- Профиль пользователя
- Steam интеграция (OpenID)
- Редактирование профиля
- Настройки уведомлений
- История заказов

##### Заказы
- Оформление заказа
- Выбор способа оплаты
- Применение промокодов
- Статусы заказов
- Email уведомления

##### Админ-панель
- Дашборд со статистикой
- Управление товарами (CRUD)
- Галерея изображений товаров
- Управление заказами
- Управление пользователями
- Блокировка пользователей
- Управление ролями
- Промокоды и акции
- Баннеры главной страницы
- Новости и объявления
- Тикеты поддержки
- Настройки системы

##### UI/UX
- Адаптивный дизайн (mobile-first)
- Тёмная и светлая тема
- Скелетоны загрузки
- Анимации переходов
- Toast уведомления
- Модальные окна
- Breadcrumbs навигация

##### Технологии
- React 18.3.1
- TypeScript 5.6
- Vite 5.4
- Tailwind CSS 3.4
- shadcn/ui + Radix UI
- TanStack Query 5
- React Hook Form + Zod
- React Router 6
- Recharts (графики)
- Lucide Icons
- date-fns

##### Backend
- Supabase (PostgreSQL 15)
- Row Level Security
- 48 таблиц
- 15 функций
- 8 триггеров
- 19 Edge Functions

##### PWA
- Service Worker
- Manifest.json
- Offline support
- Install prompt

#### Безопасность
- RLS политики на всех таблицах
- Роли: user, veteran, moderator, admin, super_admin
- Rate limiting
- Валидация входных данных
- CORS настройки
- Secure cookies

---

## [0.9.0] - 2025-12-25 (Beta)

### Beta релиз

#### Добавлено
- Базовая структура проекта
- Авторизация и регистрация
- Каталог товаров
- Корзина покупок
- Базовая админ-панель

---

## [0.5.0] - 2025-12-15 (Alpha)

### Alpha релиз

#### Добавлено
- Инициализация проекта
- Настройка Vite + React + TypeScript
- Интеграция Tailwind CSS
- Установка shadcn/ui
- Подключение Supabase
- Базовые страницы

---

## Формат версий

Проект использует [Semantic Versioning](https://semver.org/lang/ru/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** — несовместимые изменения API
- **MINOR** — новый функционал (обратно совместимый)
- **PATCH** — исправления багов

---

## Типы изменений

| Тег | Описание |
|-----|----------|
| **Added** | Новый функционал |
| **Changed** | Изменения существующего функционала |
| **Deprecated** | Функционал будет удалён в будущих версиях |
| **Removed** | Удалённый функционал |
| **Fixed** | Исправления багов |
| **Security** | Исправления безопасности |

---

## Ссылки

- [Текущая версия](https://github.com/your-username/exodus-dayz-shop/releases/latest)
- [Все релизы](https://github.com/your-username/exodus-dayz-shop/releases)
- [Сравнение версий](https://github.com/your-username/exodus-dayz-shop/compare)

---

*Последнее обновление: Январь 2026*
