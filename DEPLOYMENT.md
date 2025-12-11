# 🚀 Инструкция по развертыванию Exodus DayZ Shop

## Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Требования к серверу](#требования-к-серверу)
3. [Вариант 1: Публикация через Lovable](#вариант-1-публикация-через-lovable-рекомендуется)
4. [Вариант 2: Self-hosting](#вариант-2-self-hosting)
5. [Настройка Backend](#настройка-backend-lovable-cloud)
6. [SSL сертификат](#ssl-сертификат)
7. [Полезные команды](#полезные-команды)
8. [Troubleshooting](#troubleshooting)

---

## Обзор проекта

**Exodus DayZ Shop** — интернет-магазин для игрового сервера DayZ.

### Технологический стек:
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **UI компоненты:** shadcn/ui, Radix UI
- **Backend:** Lovable Cloud (Supabase)
- **База данных:** PostgreSQL
- **Edge Functions:** Deno
- **Платежи:** Wayforpay, NOWPayments (криптовалюта)

---

## Требования к серверу

### Минимальные требования (Self-hosting):
- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM:** 1 GB
- **CPU:** 1 vCPU
- **Диск:** 10 GB SSD
- **Node.js:** 18.x или выше
- **npm:** 9.x или выше (или Bun 1.x)

### Рекомендуемые требования:
- **RAM:** 2 GB
- **CPU:** 2 vCPU
- **Диск:** 20 GB SSD

---

## Вариант 1: Публикация через Lovable (Рекомендуется)

Самый простой способ развернуть проект.

### Шаг 1: Публикация проекта

1. Откройте проект в Lovable
2. Нажмите кнопку **"Publish"** в правом верхнем углу
3. Дождитесь завершения сборки
4. Ваш сайт доступен по адресу: `https://your-project.lovable.app`

### Шаг 2: Подключение кастомного домена

1. Перейдите в **Project Settings → Domains**
2. Нажмите **"Connect Domain"**
3. Введите ваш домен (например: `exodus-dayz.com`)
4. Добавьте DNS записи у вашего регистратора:

```
Тип: A
Имя: @
Значение: 185.158.133.1

Тип: A
Имя: www
Значение: 185.158.133.1

Тип: TXT
Имя: _lovable
Значение: lovable_verify=ABC (значение будет показано в интерфейсе)
```

5. Дождитесь пропагации DNS (до 72 часов)
6. SSL сертификат выдается автоматически

---

## Вариант 2: Self-hosting

### Шаг 1: Клонирование репозитория

```bash
# Клонируйте репозиторий
git clone <YOUR_GIT_URL> exodus-dayz-shop
cd exodus-dayz-shop
```

### Шаг 2: Установка зависимостей

**Вариант A: Используя npm**
```bash
npm install
```

**Вариант B: Используя Bun (быстрее)**
```bash
# Установка Bun (если не установлен)
curl -fsSL https://bun.sh/install | bash

# Установка зависимостей
bun install
```

### Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Supabase конфигурация
VITE_SUPABASE_URL=https://eababvkyjfkhqmjkcxiy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=eababvkyjfkhqmjkcxiy
```

> ⚠️ **Важно:** Эти значения уже настроены в Lovable Cloud. При self-hosting используйте те же значения.

### Шаг 4: Сборка проекта

```bash
# Для разработки
npm run dev

# Для продакшена
npm run build
```

После сборки статические файлы будут в папке `dist/`.

### Шаг 5: Развертывание на сервере

#### Вариант A: Nginx (рекомендуется)

1. **Установите Nginx:**
```bash
sudo apt update
sudo apt install nginx -y
```

2. **Скопируйте файлы сборки:**
```bash
sudo mkdir -p /var/www/exodus-dayz
sudo cp -r dist/* /var/www/exodus-dayz/
sudo chown -R www-data:www-data /var/www/exodus-dayz
```

3. **Создайте конфигурацию Nginx:**

```bash
sudo nano /etc/nginx/sites-available/exodus-dayz
```

```nginx
server {
    listen 80;
    server_name exodus-dayz.com www.exodus-dayz.com;
    root /var/www/exodus-dayz;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA роутинг - все запросы направляем на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

4. **Активируйте конфигурацию:**
```bash
sudo ln -s /etc/nginx/sites-available/exodus-dayz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Вариант B: Docker

1. **Создайте `Dockerfile` в корне проекта:**

```dockerfile
# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY bun.lockb ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Этап продакшена
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

2. **Создайте `nginx.conf`:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. **Создайте `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  exodus-dayz-shop:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

4. **Запустите контейнер:**
```bash
docker-compose up -d --build
```

---

## SSL сертификат

### Установка Certbot (для Nginx без Docker)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d exodus-dayz.com -d www.exodus-dayz.com

# Автоматическое обновление (добавляется автоматически)
sudo certbot renew --dry-run
```

### Для Docker

Используйте [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) с [acme-companion](https://github.com/nginx-proxy/acme-companion) для автоматического SSL.

---

## Настройка Backend (Lovable Cloud)

Backend управляется через Lovable Cloud и не требует отдельного развертывания.

### Edge Functions

Edge Functions развертываются автоматически при публикации проекта. Текущие функции:

| Функция | Описание |
|---------|----------|
| `create-order` | Создание заказа |
| `wayforpay-payment` | Обработка платежей Wayforpay |
| `nowpayments-payment` | Обработка криптоплатежей |
| `steam-auth` | Авторизация через Steam |
| `seed-products` | Наполнение базы товарами |
| `send-order-email` | Отправка email уведомлений |

### Секреты (Environment Variables)

Настроенные секреты в проекте:

| Секрет | Описание |
|--------|----------|
| `WAYFORPAY_MERCHANT_ACCOUNT` | ID мерчанта Wayforpay |
| `WAYFORPAY_SECRET_KEY` | Секретный ключ Wayforpay |
| `NOWPAYMENTS_API_KEY` | API ключ NOWPayments |
| `NOWPAYMENTS_IPN_SECRET` | IPN секрет NOWPayments |
| `RESEND_API_KEY` | API ключ для отправки email |

### Добавление нового секрета

1. В Lovable откройте **Cloud** панель
2. Перейдите в раздел **Secrets**
3. Нажмите **Add Secret**
4. Введите имя и значение секрета

---

## Полезные команды

### Разработка

```bash
# Запуск dev сервера
npm run dev

# Запуск с открытием в браузере
npm run dev -- --open

# Проверка типов TypeScript
npx tsc --noEmit

# Линтинг
npm run lint
```

### Продакшен

```bash
# Сборка
npm run build

# Предпросмотр сборки локально
npm run preview
```

### Docker

```bash
# Сборка образа
docker build -t exodus-dayz-shop .

# Запуск контейнера
docker run -d -p 80:80 exodus-dayz-shop

# Просмотр логов
docker logs -f <container_id>

# Остановка
docker-compose down
```

### Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Просмотр логов
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Проблема: Белый экран после деплоя

**Решение:**
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что переменные окружения установлены
3. Проверьте, что Nginx правильно настроен для SPA

### Проблема: 404 ошибки при обновлении страницы

**Решение:**
Убедитесь, что в конфигурации Nginx есть:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Проблема: CORS ошибки

**Решение:**
1. Проверьте, что домен добавлен в настройки Supabase
2. Проверьте заголовки CORS в Edge Functions

### Проблема: Не работают платежи

**Решение:**
1. Проверьте, что секреты `WAYFORPAY_*` и `NOWPAYMENTS_*` установлены
2. Проверьте callback URL в настройках платежной системы
3. Проверьте логи Edge Functions

### Проблема: Не отправляются email

**Решение:**
1. Проверьте секрет `RESEND_API_KEY`
2. Убедитесь, что домен верифицирован в Resend
3. Проверьте логи функции `send-order-email`

### Проблема: Медленная загрузка

**Решение:**
1. Включите Gzip сжатие в Nginx
2. Настройте кэширование статики
3. Используйте CDN (Cloudflare)

---

## Поддержка

- **Документация Lovable:** https://docs.lovable.dev/
- **Discord сообщество:** https://discord.gg/lovable

---

*Последнее обновление: Декабрь 2024*
