# 🔌 API Reference

Документация Edge Functions (Supabase Functions) проекта Exodus DayZ Shop.

---

## 📑 Содержание

- [Обзор](#обзор)
- [Аутентификация](#аутентификация)
- [Платежные функции](#платежные-функции)
- [Steam интеграция](#steam-интеграция)
- [Telegram интеграция](#telegram-интеграция)
- [Email функции](#email-функции)
- [Утилиты](#утилиты)

---

## Обзор

| Функция | Описание | Аутентификация |
|---------|----------|----------------|
| `create-order` | Создание заказа | ✅ Требуется |
| `wayforpay-payment` | Обработка платежа WayForPay | ❌ Webhook |
| `nowpayments-payment` | Обработка платежа NOWPayments | ❌ Webhook |
| `steam-auth` | Авторизация через Steam | ❌ Public |
| `steam-profile` | Получение профиля Steam | ✅ Требуется |
| `telegram-bot` | Webhook Telegram бота | ❌ Webhook |
| `telegram-notify` | Отправка уведомления в Telegram | ✅ Требуется |
| `discord-notify` | Отправка уведомления в Discord | ✅ Требуется |
| `send-order-email` | Email о заказе | ✅ Требуется |
| `send-status-email` | Email о статусе | ✅ Требуется |
| `send-welcome-email` | Приветственный email | ✅ Требуется |
| `send-promo-email` | Промо email | ✅ Admin |
| `send-broadcast` | Массовая рассылка | ✅ Admin |
| `send-cart-reminder` | Напоминание о корзине | ✅ Admin |
| `send-recommendations` | Email с рекомендациями | ✅ Admin |
| `send-push-notification` | Push уведомление | ✅ Требуется |
| `notify-ending-promotions` | Уведомление об окончании акций | ✅ Admin |
| `set-telegram-webhook` | Настройка webhook Telegram | ✅ Admin |
| `seed-products` | Заполнение товаров | ✅ Admin |

---

## Аутентификация

### Headers

Для функций, требующих аутентификации, передайте JWT токен:

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  },
  body: { ... }
});
```

### Роли

| Роль | Описание |
|------|----------|
| `user` | Обычный пользователь |
| `veteran` | Ветеран сервера |
| `moderator` | Модератор |
| `admin` | Администратор |
| `super_admin` | Супер-админ |

---

## Платежные функции

### create-order

Создание нового заказа.

**Endpoint:** `POST /functions/v1/create-order`

**Аутентификация:** Требуется

**Request:**
```json
{
  "items": [
    {
      "product_id": "vehicle-ada",
      "quantity": 1,
      "price": 150
    }
  ],
  "steam_id": "76561198xxxxxxxxx",
  "payment_method": "wayforpay",
  "promo_code": "DISCOUNT10"
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "uuid",
  "payment_url": "https://secure.wayforpay.com/...",
  "total_amount": 150,
  "discount_amount": 15,
  "final_amount": 135
}
```

**Ошибки:**
| Код | Описание |
|-----|----------|
| 400 | Невалидные данные |
| 401 | Не авторизован |
| 402 | Недостаточно средств (для баланса) |
| 404 | Товар не найден |

---

### wayforpay-payment

Webhook для обработки платежей WayForPay.

**Endpoint:** `POST /functions/v1/wayforpay-payment`

**Аутентификация:** Webhook signature

**Request (от WayForPay):**
```json
{
  "merchantAccount": "exodus_shop",
  "orderReference": "order_uuid",
  "amount": 150,
  "currency": "UAH",
  "transactionStatus": "Approved",
  "merchantSignature": "..."
}
```

**Response:**
```json
{
  "orderReference": "order_uuid",
  "status": "accept",
  "time": 1704067200,
  "signature": "..."
}
```

**Статусы:**
| Статус | Действие |
|--------|----------|
| `Approved` | Заказ оплачен |
| `Declined` | Заказ отменён |
| `Refunded` | Возврат средств |

---

### nowpayments-payment

Webhook для обработки криптоплатежей NOWPayments.

**Endpoint:** `POST /functions/v1/nowpayments-payment`

**Аутентификация:** IPN Secret

**Request (от NOWPayments):**
```json
{
  "payment_id": 123456,
  "order_id": "order_uuid",
  "payment_status": "finished",
  "pay_amount": 150,
  "pay_currency": "usdttrc20",
  "actually_paid": 150
}
```

**Response:**
```json
{
  "success": true
}
```

**Статусы:**
| Статус | Действие |
|--------|----------|
| `finished` | Заказ оплачен |
| `failed` | Заказ отменён |
| `expired` | Время истекло |

---

## Steam интеграция

### steam-auth

Инициация авторизации через Steam.

**Endpoint:** `GET /functions/v1/steam-auth`

**Аутентификация:** Не требуется

**Query params:**
| Параметр | Описание |
|----------|----------|
| `return_url` | URL для возврата |
| `user_id` | ID пользователя для привязки |

**Response:**
```json
{
  "redirect_url": "https://steamcommunity.com/openid/login?..."
}
```

---

### steam-profile

Получение профиля Steam.

**Endpoint:** `POST /functions/v1/steam-profile`

**Аутентификация:** Требуется

**Request:**
```json
{
  "steam_id": "76561198xxxxxxxxx"
}
```

**Response:**
```json
{
  "steamid": "76561198xxxxxxxxx",
  "personaname": "PlayerName",
  "avatarfull": "https://steamcdn-a.akamaihd.net/...",
  "profileurl": "https://steamcommunity.com/id/..."
}
```

---

## Telegram интеграция

### telegram-bot

Webhook для Telegram бота.

**Endpoint:** `POST /functions/v1/telegram-bot`

**Аутентификация:** Telegram webhook

**Поддерживаемые команды:**
| Команда | Описание |
|---------|----------|
| `/start` | Начало работы с ботом |
| `/link <code>` | Привязка аккаунта |
| `/balance` | Проверка баланса |
| `/orders` | Список заказов |
| `/help` | Помощь |

---

### telegram-notify

Отправка уведомления в Telegram.

**Endpoint:** `POST /functions/v1/telegram-notify`

**Аутентификация:** Требуется

**Request:**
```json
{
  "user_id": "uuid",
  "message": "Ваш заказ #123 оплачен!"
}
```

**Response:**
```json
{
  "success": true,
  "telegram_id": 123456789
}
```

---

### set-telegram-webhook

Настройка webhook для Telegram бота.

**Endpoint:** `POST /functions/v1/set-telegram-webhook`

**Аутентификация:** Admin

**Response:**
```json
{
  "success": true,
  "webhook_url": "https://xxx.supabase.co/functions/v1/telegram-bot",
  "webhook_info": { ... }
}
```

---

## Email функции

### send-order-email

Отправка email о заказе.

**Endpoint:** `POST /functions/v1/send-order-email`

**Аутентификация:** Требуется

**Request:**
```json
{
  "email": "user@example.com",
  "order_id": "uuid",
  "order_number": "123",
  "items": [
    { "name": "ADA 4x4", "price": 150, "quantity": 1 }
  ],
  "total": 150
}
```

---

### send-status-email

Email об изменении статуса заказа.

**Endpoint:** `POST /functions/v1/send-status-email`

**Аутентификация:** Требуется

**Request:**
```json
{
  "email": "user@example.com",
  "order_id": "uuid",
  "status": "paid",
  "order_number": "123"
}
```

---

### send-welcome-email

Приветственный email.

**Endpoint:** `POST /functions/v1/send-welcome-email`

**Аутентификация:** Требуется

**Request:**
```json
{
  "email": "user@example.com",
  "username": "PlayerName"
}
```

---

### send-promo-email

Промо-рассылка.

**Endpoint:** `POST /functions/v1/send-promo-email`

**Аутентификация:** Admin

**Request:**
```json
{
  "campaign_id": "uuid",
  "subject": "Скидки до 50%!",
  "body": "<html>...</html>",
  "target_audience": "all"
}
```

---

### send-broadcast

Массовая рассылка (email + push + in-app).

**Endpoint:** `POST /functions/v1/send-broadcast`

**Аутентификация:** Admin

**Request:**
```json
{
  "broadcast_id": "uuid"
}
```

---

### send-cart-reminder

Напоминание о брошенной корзине.

**Endpoint:** `POST /functions/v1/send-cart-reminder`

**Аутентификация:** Admin (Cron)

**Response:**
```json
{
  "success": true,
  "sent_count": 15,
  "failed_count": 0
}
```

---

### send-recommendations

Email с персональными рекомендациями.

**Endpoint:** `POST /functions/v1/send-recommendations`

**Аутентификация:** Admin (Cron)

---

### notify-ending-promotions

Уведомления об окончании акций.

**Endpoint:** `POST /functions/v1/notify-ending-promotions`

**Аутентификация:** Admin (Cron)

---

## Discord интеграция

### discord-notify

Отправка уведомления в Discord канал.

**Endpoint:** `POST /functions/v1/discord-notify`

**Аутентификация:** Требуется

**Request:**
```json
{
  "order_id": "uuid"
}
```

---

## Утилиты

### send-push-notification

Отправка Push уведомления.

**Endpoint:** `POST /functions/v1/send-push-notification`

**Аутентификация:** Требуется

**Request:**
```json
{
  "user_id": "uuid",
  "payload": {
    "title": "Новый заказ",
    "body": "Заказ #123 успешно создан",
    "url": "/orders/uuid",
    "icon": "/icons/order.png"
  }
}
```

---

### seed-products

Заполнение базы тестовыми товарами.

**Endpoint:** `POST /functions/v1/seed-products`

**Аутентификация:** Admin

**Response:**
```json
{
  "success": true,
  "count": 20
}
```

---

## Использование с Supabase Client

```typescript
import { supabase } from '@/integrations/supabase/client';

// Вызов функции с авторизацией
const { data, error } = await supabase.functions.invoke('create-order', {
  body: {
    items: [{ product_id: 'vehicle-ada', quantity: 1, price: 150 }],
    steam_id: '76561198xxx',
    payment_method: 'balance'
  }
});

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Order created:', data);
}
```

---

## Обработка ошибок

Все функции возвращают ошибки в формате:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Коды ошибок

| Код | Описание |
|-----|----------|
| `UNAUTHORIZED` | Требуется авторизация |
| `FORBIDDEN` | Недостаточно прав |
| `NOT_FOUND` | Ресурс не найден |
| `INVALID_INPUT` | Невалидные данные |
| `INSUFFICIENT_BALANCE` | Недостаточно средств |
| `PAYMENT_FAILED` | Ошибка платежа |
| `RATE_LIMITED` | Превышен лимит запросов |
| `INTERNAL_ERROR` | Внутренняя ошибка |

---

## Rate Limiting

Все функции защищены rate limiting:

| Эндпоинт | Лимит |
|----------|-------|
| Публичные | 100 req/min |
| Аутентифицированные | 300 req/min |
| Admin | 1000 req/min |

При превышении лимита возвращается:

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "retry_after": 60
}
```
