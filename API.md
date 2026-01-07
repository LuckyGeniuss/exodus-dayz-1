# 🔌 API Reference

Документация Edge Functions проекта Exodus DayZ Shop.

---

## 📑 Содержание

- [Обзор](#обзор)
- [Аутентификация](#аутентификация)
- [Платежные функции](#платежные-функции)
- [Steam интеграция](#steam-интеграция)
- [Telegram интеграция](#telegram-интеграция)
- [Discord интеграция](#discord-интеграция)
- [Email функции](#email-функции)
- [Push уведомления](#push-уведомления)
- [Утилиты](#утилиты)
- [Обработка ошибок](#обработка-ошибок)
- [Rate Limiting](#rate-limiting)

---

## Обзор

| Функция | Описание | Аутентификация | Метод |
|---------|----------|----------------|-------|
| `create-order` | Создание заказа | ✅ User | POST |
| `wayforpay-payment` | Webhook WayForPay | 🔐 Signature | POST |
| `nowpayments-payment` | Webhook NOWPayments | 🔐 IPN Secret | POST |
| `steam-auth` | Авторизация Steam | ❌ Public | GET |
| `steam-profile` | Профиль Steam | ✅ User | POST |
| `telegram-bot` | Webhook Telegram | 🔐 Bot Token | POST |
| `telegram-notify` | Уведомление Telegram | ✅ User | POST |
| `set-telegram-webhook` | Настройка webhook | ✅ Admin | POST |
| `discord-notify` | Уведомление Discord | ✅ User | POST |
| `send-order-email` | Email о заказе | ✅ User | POST |
| `send-status-email` | Email о статусе | ✅ User | POST |
| `send-welcome-email` | Приветственный email | ✅ User | POST |
| `send-promo-email` | Промо email | ✅ Admin | POST |
| `send-broadcast` | Массовая рассылка | ✅ Admin | POST |
| `send-cart-reminder` | Напоминание о корзине | ✅ Admin/Cron | POST |
| `send-recommendations` | Рекомендации | ✅ Admin/Cron | POST |
| `send-push-notification` | Push уведомление | ✅ User | POST |
| `notify-ending-promotions` | Уведомления об акциях | ✅ Admin/Cron | POST |
| `seed-products` | Заполнение товаров | ✅ Admin | POST |

**Легенда:**
- ✅ User — требуется JWT токен пользователя
- ✅ Admin — требуется JWT токен с ролью admin/super_admin
- 🔐 Signature — проверка подписи webhook
- ❌ Public — без аутентификации

---

## Аутентификация

### JWT Token

Для функций, требующих аутентификации, передайте JWT токен в заголовке:

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ... }
});
// Токен передаётся автоматически через Supabase клиент
```

Или вручную:

```typescript
const response = await fetch('https://xxx.supabase.co/functions/v1/function-name', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
});
```

### Роли пользователей

| Роль | Уровень | Доступные функции |
|------|---------|-------------------|
| `user` | 1 | Базовые операции (заказы, профиль) |
| `veteran` | 2 | + Скидки ветерана |
| `moderator` | 3 | + Просмотр тикетов |
| `admin` | 4 | + Управление контентом, рассылки |
| `super_admin` | 5 | Полный доступ ко всем функциям |

### Проверка роли в Edge Function

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Проверка роли
const { data: hasRole } = await supabase.rpc('has_role', {
  _user_id: userId,
  _role: 'admin'
});

if (!hasRole) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
}
```

---

## Платежные функции

### create-order

Создание нового заказа с опциональной оплатой.

**Endpoint:** `POST /functions/v1/create-order`

**Аутентификация:** ✅ User

**Request:**
```typescript
interface CreateOrderRequest {
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  steam_id: string;           // Steam ID для доставки (17 цифр)
  payment_method: 'balance' | 'wayforpay' | 'nowpayments';
  promo_code?: string;        // Опциональный промокод
}
```

**Пример:**
```json
{
  "items": [
    { "product_id": "vehicle-ada", "quantity": 1, "price": 150 },
    { "product_id": "build-nails", "quantity": 2, "price": 25 }
  ],
  "steam_id": "76561198123456789",
  "payment_method": "wayforpay",
  "promo_code": "DISCOUNT10"
}
```

**Response (Success):**
```typescript
interface CreateOrderResponse {
  success: true;
  order_id: string;           // UUID заказа
  payment_url?: string;       // URL для оплаты (wayforpay/nowpayments)
  total_amount: number;       // Сумма до скидки
  discount_amount: number;    // Размер скидки
  final_amount: number;       // Итоговая сумма
}
```

**Пример ответа:**
```json
{
  "success": true,
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "payment_url": "https://secure.wayforpay.com/pay?...",
  "total_amount": 200,
  "discount_amount": 20,
  "final_amount": 180
}
```

**Ошибки:**
| HTTP | Код | Описание |
|------|-----|----------|
| 400 | `INVALID_INPUT` | Невалидные данные |
| 401 | `UNAUTHORIZED` | Не авторизован |
| 402 | `INSUFFICIENT_BALANCE` | Недостаточно средств (для balance) |
| 404 | `NOT_FOUND` | Товар не найден |
| 422 | `PROMO_INVALID` | Промокод недействителен |

---

### wayforpay-payment

Webhook для обработки платежей WayForPay.

**Endpoint:** `POST /functions/v1/wayforpay-payment`

**Аутентификация:** 🔐 Merchant Signature

**Headers:**
- `Content-Type: application/x-www-form-urlencoded` или `application/json`

**Request (от WayForPay):**
```typescript
interface WayForPayCallback {
  merchantAccount: string;
  orderReference: string;     // UUID заказа
  merchantSignature: string;  // HMAC-MD5 подпись
  amount: number;
  currency: string;           // UAH
  authCode: string;
  cardPan: string;
  transactionStatus: 'Approved' | 'Declined' | 'Pending' | 'Refunded';
  reasonCode?: number;
  reason?: string;
  createdDate: number;
  processingDate: number;
  fee: number;
}
```

**Response:**
```json
{
  "orderReference": "550e8400-e29b-41d4-a716-446655440000",
  "status": "accept",
  "time": 1704067200,
  "signature": "a1b2c3d4e5f6..."
}
```

**Обработка статусов:**
| Статус | Действие в системе |
|--------|-------------------|
| `Approved` | Заказ помечается как `completed`, начисляется кэшбек |
| `Declined` | Заказ помечается как `failed` |
| `Pending` | Ожидание (без изменений) |
| `Refunded` | Возврат средств на баланс |

---

### nowpayments-payment

Webhook для обработки криптоплатежей NOWPayments.

**Endpoint:** `POST /functions/v1/nowpayments-payment`

**Аутентификация:** 🔐 IPN Secret (в заголовке `x-nowpayments-sig`)

**Request (от NOWPayments):**
```typescript
interface NOWPaymentsCallback {
  payment_id: number;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';
  order_id: string;           // UUID заказа
  order_description: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;       // btc, eth, usdt и др.
  actually_paid: number;
  actually_paid_at_fiat: number;
  created_at: string;
  updated_at: string;
}
```

**Response:**
```json
{
  "success": true
}
```

**Обработка статусов:**
| Статус | Действие |
|--------|----------|
| `finished` | Заказ оплачен |
| `confirmed` | Подтверждение в блокчейне |
| `failed` | Ошибка оплаты |
| `expired` | Время истекло |
| `refunded` | Возврат |

---

## Steam интеграция

### steam-auth

Инициация авторизации через Steam OpenID.

**Endpoint:** `GET /functions/v1/steam-auth`

**Аутентификация:** ❌ Public

**Query параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `return_url` | string | URL для возврата после авторизации |
| `user_id` | string | UUID пользователя для привязки Steam |

**Пример:**
```
GET /functions/v1/steam-auth?return_url=https://shop.example.com/profile&user_id=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "redirect_url": "https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&..."
}
```

**Callback обработка:**
После успешной авторизации Steam редиректит на `return_url` с параметрами OpenID.
Функция валидирует ответ и привязывает Steam ID к профилю пользователя.

---

### steam-profile

Получение публичной информации профиля Steam.

**Endpoint:** `POST /functions/v1/steam-profile`

**Аутентификация:** ✅ User

**Request:**
```json
{
  "steam_id": "76561198123456789"
}
```

**Response:**
```typescript
interface SteamProfile {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;        // Никнейм
  profileurl: string;         // URL профиля
  avatar: string;             // 32x32
  avatarmedium: string;       // 64x64
  avatarfull: string;         // 184x184
  personastate: number;       // 0-6 (offline, online, busy, etc.)
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}
```

**Пример ответа:**
```json
{
  "steamid": "76561198123456789",
  "personaname": "DayZPlayer",
  "avatarfull": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/xx/xxxxx_full.jpg",
  "profileurl": "https://steamcommunity.com/id/dayzplayer/",
  "personastate": 1,
  "timecreated": 1234567890
}
```

---

## Telegram интеграция

### telegram-bot

Webhook для обработки сообщений Telegram бота.

**Endpoint:** `POST /functions/v1/telegram-bot`

**Аутентификация:** 🔐 Telegram Webhook (проверка по IP и token)

**Поддерживаемые команды:**

| Команда | Описание |
|---------|----------|
| `/start` | Начало работы с ботом, приветствие |
| `/link <code>` | Привязка аккаунта магазина |
| `/balance` | Проверка баланса |
| `/orders` | Список последних заказов |
| `/help` | Справка по командам |
| `/unlink` | Отвязка аккаунта |

**Request (от Telegram):**
```typescript
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}
```

**Response:**
```json
{
  "ok": true
}
```

---

### telegram-notify

Отправка уведомления пользователю в Telegram.

**Endpoint:** `POST /functions/v1/telegram-notify`

**Аутентификация:** ✅ User

**Request:**
```typescript
interface TelegramNotifyRequest {
  user_id: string;    // UUID пользователя
  message: string;    // Текст сообщения (поддерживает Markdown)
  parse_mode?: 'Markdown' | 'HTML';
}
```

**Пример:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "🎉 *Ваш заказ #123 оплачен!*\n\nТовары скоро будут доставлены на ваш Steam аккаунт.",
  "parse_mode": "Markdown"
}
```

**Response:**
```json
{
  "success": true,
  "telegram_id": 123456789,
  "message_id": 456
}
```

**Ошибки:**
| HTTP | Код | Описание |
|------|-----|----------|
| 404 | `TELEGRAM_NOT_LINKED` | Telegram не привязан |
| 400 | `TELEGRAM_BLOCKED` | Пользователь заблокировал бота |

---

### set-telegram-webhook

Настройка webhook URL для Telegram бота.

**Endpoint:** `POST /functions/v1/set-telegram-webhook`

**Аутентификация:** ✅ Admin

**Request:** Без тела (настройки берутся из переменных окружения)

**Response:**
```json
{
  "success": true,
  "webhook_url": "https://eababvkyjfkhqmjkcxiy.supabase.co/functions/v1/telegram-bot",
  "webhook_info": {
    "url": "https://...",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

---

## Discord интеграция

### discord-notify

Отправка уведомления в Discord канал (через webhook).

**Endpoint:** `POST /functions/v1/discord-notify`

**Аутентификация:** ✅ User

**Request:**
```typescript
interface DiscordNotifyRequest {
  order_id: string;       // UUID заказа
  type?: 'order' | 'payment' | 'refund';
}
```

**Пример:**
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "order"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "1234567890"
}
```

**Discord Embed пример:**
```json
{
  "embeds": [{
    "title": "🛒 Новый заказ #ABC123",
    "color": 5763719,
    "fields": [
      { "name": "Покупатель", "value": "DayZPlayer", "inline": true },
      { "name": "Steam ID", "value": "76561198...", "inline": true },
      { "name": "Сумма", "value": "150₴", "inline": true },
      { "name": "Товары", "value": "• ADA 4x4 (1)\n• Nails (2)" }
    ],
    "timestamp": "2024-01-15T12:00:00Z"
  }]
}
```

---

## Email функции

### send-order-email

Отправка email подтверждения заказа.

**Endpoint:** `POST /functions/v1/send-order-email`

**Аутентификация:** ✅ User

**Request:**
```typescript
interface OrderEmailRequest {
  email: string;
  order_id: string;
  order_number: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  discount?: number;
  steam_id: string;
}
```

**Пример:**
```json
{
  "email": "user@example.com",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_number": "ABC123",
  "items": [
    { "name": "ADA 4x4", "price": 150, "quantity": 1 }
  ],
  "total": 150,
  "steam_id": "76561198123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "msg_xxx"
}
```

---

### send-status-email

Email об изменении статуса заказа.

**Endpoint:** `POST /functions/v1/send-status-email`

**Аутентификация:** ✅ User

**Request:**
```typescript
interface StatusEmailRequest {
  email: string;
  order_id: string;
  order_number: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'delivered';
  status_message?: string;
}
```

**Пример:**
```json
{
  "email": "user@example.com",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_number": "ABC123",
  "status": "delivered",
  "status_message": "Товары успешно доставлены на ваш Steam аккаунт!"
}
```

---

### send-welcome-email

Приветственный email для новых пользователей.

**Endpoint:** `POST /functions/v1/send-welcome-email`

**Аутентификация:** ✅ User

**Request:**
```json
{
  "email": "user@example.com",
  "username": "DayZPlayer"
}
```

---

### send-promo-email

Промо-рассылка для email кампании.

**Endpoint:** `POST /functions/v1/send-promo-email`

**Аутентификация:** ✅ Admin

**Request:**
```typescript
interface PromoEmailRequest {
  campaign_id: string;        // UUID кампании
  subject: string;
  body: string;               // HTML контент
  target_audience: 'all' | 'active' | 'inactive' | 'veterans';
}
```

**Пример:**
```json
{
  "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
  "subject": "🔥 Скидки до 50% на все транспортные средства!",
  "body": "<html>...</html>",
  "target_audience": "all"
}
```

**Response:**
```json
{
  "success": true,
  "sent_count": 150,
  "failed_count": 2
}
```

---

### send-broadcast

Массовая рассылка (email + push + in-app).

**Endpoint:** `POST /functions/v1/send-broadcast`

**Аутентификация:** ✅ Admin

**Request:**
```json
{
  "broadcast_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

Broadcast берётся из таблицы `broadcast_messages` по ID.

**Response:**
```json
{
  "success": true,
  "email_sent": 120,
  "push_sent": 85,
  "notifications_created": 150,
  "failed": 5
}
```

---

### send-cart-reminder

Напоминание о брошенной корзине.

**Endpoint:** `POST /functions/v1/send-cart-reminder`

**Аутентификация:** ✅ Admin (Cron)

**Логика:**
- Находит пользователей с корзиной, обновлённой >24 часов назад
- Отправляет email напоминание
- Создаёт in-app уведомление

**Response:**
```json
{
  "success": true,
  "users_notified": 15,
  "emails_sent": 12,
  "failed": 0
}
```

---

### send-recommendations

Email с персональными рекомендациями товаров.

**Endpoint:** `POST /functions/v1/send-recommendations`

**Аутентификация:** ✅ Admin (Cron)

**Логика:**
- Анализирует историю покупок и просмотров
- Генерирует персональные рекомендации
- Отправляет email активным пользователям

**Response:**
```json
{
  "success": true,
  "sent_count": 50
}
```

---

### notify-ending-promotions

Уведомления об окончании акций.

**Endpoint:** `POST /functions/v1/notify-ending-promotions`

**Аутентификация:** ✅ Admin (Cron)

**Логика:**
- Находит акции, заканчивающиеся в ближайшие 24 часа
- Уведомляет пользователей с товарами в wishlist

**Response:**
```json
{
  "success": true,
  "promotions_ending": 3,
  "users_notified": 25
}
```

---

## Push уведомления

### send-push-notification

Отправка Web Push уведомления.

**Endpoint:** `POST /functions/v1/send-push-notification`

**Аутентификация:** ✅ User

**Request:**
```typescript
interface PushNotificationRequest {
  user_id: string;
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;           // URL для клика
    tag?: string;           // Группировка уведомлений
    data?: object;          // Дополнительные данные
  };
}
```

**Пример:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "title": "🛒 Новый заказ!",
    "body": "Заказ #ABC123 успешно создан",
    "icon": "/icons/cart.png",
    "url": "/orders/550e8400-e29b-41d4-a716-446655440000",
    "tag": "order"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sent_to_endpoints": 2
}
```

---

## Утилиты

### seed-products

Заполнение базы тестовыми товарами.

**Endpoint:** `POST /functions/v1/seed-products`

**Аутентификация:** ✅ Admin

**⚠️ Внимание:** Эта функция перезаписывает существующие товары!

**Response:**
```json
{
  "success": true,
  "products_created": 20,
  "categories": ["vehicles", "containers", "building", "parts", "vip"]
}
```

---

## Обработка ошибок

### Формат ошибок

Все функции возвращают ошибки в едином формате:

```typescript
interface ErrorResponse {
  error: string;          // Человекочитаемое сообщение
  code: string;           // Код ошибки для обработки
  details?: object;       // Дополнительные данные
}
```

**Пример:**
```json
{
  "error": "Недостаточно средств на балансе",
  "code": "INSUFFICIENT_BALANCE",
  "details": {
    "required": 150,
    "available": 100
  }
}
```

### Коды ошибок

| Код | HTTP | Описание |
|-----|------|----------|
| `UNAUTHORIZED` | 401 | Требуется авторизация |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `INVALID_INPUT` | 400 | Невалидные входные данные |
| `VALIDATION_ERROR` | 422 | Ошибка валидации |
| `INSUFFICIENT_BALANCE` | 402 | Недостаточно средств |
| `PAYMENT_FAILED` | 402 | Ошибка платежа |
| `RATE_LIMITED` | 429 | Превышен лимит запросов |
| `PROMO_INVALID` | 422 | Промокод недействителен |
| `PROMO_EXPIRED` | 422 | Промокод истёк |
| `STEAM_NOT_LINKED` | 400 | Steam не привязан |
| `TELEGRAM_NOT_LINKED` | 400 | Telegram не привязан |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

### Обработка на клиенте

```typescript
import { supabase } from '@/integrations/supabase/client';

const createOrder = async (orderData: OrderRequest) => {
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: orderData
  });
  
  if (error) {
    // Ошибка сети или сервера
    throw new Error('Network error');
  }
  
  if (!data.success) {
    // Бизнес-ошибка
    switch (data.code) {
      case 'INSUFFICIENT_BALANCE':
        toast.error('Недостаточно средств на балансе');
        break;
      case 'PROMO_INVALID':
        toast.error('Промокод недействителен');
        break;
      default:
        toast.error(data.error || 'Ошибка создания заказа');
    }
    return null;
  }
  
  return data;
};
```

---

## Rate Limiting

### Лимиты

Все функции защищены rate limiting на уровне базы данных:

| Категория | Лимит | Окно |
|-----------|-------|------|
| Публичные | 100 запросов | 1 минута |
| Аутентифицированные | 300 запросов | 1 минута |
| Платежные | 10 запросов | 1 минута |
| Admin | 1000 запросов | 1 минута |

### Ответ при превышении

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "retry_after": 45
}
```

HTTP статус: `429 Too Many Requests`

Заголовки:
```
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
```

### Реализация rate limit

```typescript
// В Edge Function
const { data: allowed } = await supabase.rpc('check_rate_limit', {
  _user_id: userId,
  _ip_address: request.headers.get('x-forwarded-for') || 'unknown',
  _endpoint: 'create-order',
  _max_requests: 10,
  _window_minutes: 1
});

if (!allowed) {
  return new Response(
    JSON.stringify({ error: 'Too many requests', code: 'RATE_LIMITED' }),
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}
```

---

## CORS

Все Edge Functions настроены для работы с CORS:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Обработка preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

---

## Примеры использования

### Создание заказа с оплатой через баланс

```typescript
const { data, error } = await supabase.functions.invoke('create-order', {
  body: {
    items: [
      { product_id: 'vehicle-ada', quantity: 1, price: 150 }
    ],
    steam_id: profile.steam_id,
    payment_method: 'balance'
  }
});

if (data?.success) {
  toast.success('Заказ оформлен!');
  router.push(`/orders/${data.order_id}`);
}
```

### Привязка Steam аккаунта

```typescript
// Получение URL для авторизации
const { data } = await supabase.functions.invoke('steam-auth', {
  method: 'GET',
  body: {
    return_url: window.location.origin + '/profile',
    user_id: user.id
  }
});

// Редирект на Steam
window.location.href = data.redirect_url;
```

### Отправка уведомления в Telegram

```typescript
await supabase.functions.invoke('telegram-notify', {
  body: {
    user_id: order.user_id,
    message: `✅ *Заказ #${order.id.slice(0, 8)} доставлен!*\n\nТовары отправлены на Steam ID: \`${order.steam_id}\``,
    parse_mode: 'Markdown'
  }
});
```

---

## Переменные окружения

Edge Functions используют следующие секреты:

| Переменная | Описание |
|------------|----------|
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role ключ |
| `WAYFORPAY_MERCHANT_ACCOUNT` | Аккаунт WayForPay |
| `WAYFORPAY_SECRET_KEY` | Секретный ключ WayForPay |
| `NOWPAYMENTS_API_KEY` | API ключ NOWPayments |
| `NOWPAYMENTS_IPN_SECRET` | IPN секрет NOWPayments |
| `RESEND_API_KEY` | API ключ Resend (email) |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота |
| `DISCORD_WEBHOOK_URL` | URL Discord webhook |
| `STEAM_API_KEY` | Ключ Steam Web API |

---

*Документация обновлена: Январь 2026*
