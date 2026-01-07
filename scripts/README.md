# 📁 Database Scripts

Цей каталог містить SQL скрипти для керування базою даних Exodus DayZ Shop.

## 📋 Файли

| Файл | Опис |
|------|------|
| `database-dump.sql` | Повний дамп схеми БД (таблиці, функції, тригери, RLS) |
| `seed-data.sql` | Тестові дані для демонстрації та розробки |

## 🚀 Використання

### Імпорт схеми бази даних

#### Через Lovable Cloud
1. Відкрийте проект в Lovable
2. Перейдіть до Backend → SQL Editor
3. Скопіюйте вміст `database-dump.sql`
4. Виконайте SQL

#### Через psql (локально)
```bash
psql -h <host> -U <user> -d <database> -f database-dump.sql
```

#### Через Supabase CLI
```bash
supabase db push
```

### Імпорт тестових даних

```bash
# Після імпорту схеми
psql -h <host> -U <user> -d <database> -f seed-data.sql
```

Або через SQL Editor в Lovable Cloud.

## 📊 Експорт даних

### Експорт схеми (без даних)
```bash
pg_dump -h <host> -U <user> -d <database> --schema-only > schema-export.sql
```

### Експорт з даними
```bash
pg_dump -h <host> -U <user> -d <database> > full-export.sql
```

### Експорт окремих таблиць
```bash
pg_dump -h <host> -U <user> -d <database> -t products -t orders > selected-tables.sql
```

## 🔄 Скидання бази даних

⚠️ **УВАГА**: Це видалить всі дані!

```sql
-- Видалити всі таблиці
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Потім імпортувати схему
\i database-dump.sql

-- Опціонально: додати тестові дані
\i seed-data.sql
```

## 📝 Структура схеми

### Основні таблиці
- `profiles` - Профілі користувачів
- `products` - Каталог товарів
- `orders` / `order_items` - Замовлення
- `cart_items` - Кошик
- `wishlist` - Список бажань

### Платіжні таблиці
- `balance_transactions` - Транзакції балансу
- `promo_codes` / `promo_code_uses` - Промокоди

### Гейміфікація
- `achievements` / `user_achievements` - Досягнення
- `referrals` - Реферальна програма
- `daily_rewards` - Щоденні бонуси
- `fortune_wheel_spins` - Колесо фортуни
- `loyalty_levels` - Рівні лояльності

### Комунікації
- `notifications` - Сповіщення
- `support_tickets` / `ticket_messages` - Підтримка
- `news_posts` - Новини

### Адміністрування
- `admin_settings` - Налаштування
- `admin_audit_logs` - Журнал дій
- `cron_jobs` - Заплановані задачі

## 🔐 Row Level Security

Всі таблиці мають увімкнений RLS з відповідними політиками:
- Користувачі бачать тільки свої дані
- Адміністратори мають повний доступ
- Публічні таблиці (products, news) доступні всім

## 📈 Індекси

Створені індекси для оптимізації:
- `idx_products_category` - пошук по категорії
- `idx_orders_user_id` - замовлення користувача
- `idx_orders_created_at` - сортування по даті
- `idx_notifications_user_id` - сповіщення користувача

## 🛠️ Функції

Основні функції бази даних:
- `claim_daily_bonus()` - отримання щоденного бонусу
- `spin_fortune_wheel()` - обертання колеса фортуни
- `safe_deduct_balance()` - безпечне списання балансу
- `has_role()` - перевірка ролі користувача
- `calculate_daily_bonus()` - розрахунок бонусу по серії

## 📞 Підтримка

При виникненні проблем:
1. Перевірте логи Supabase
2. Переконайтеся в правильності підключення
3. Створіть Issue в репозиторії

---

**Exodus DayZ Shop** © 2025
