# 🤝 Руководство по вкладу в проект

Спасибо за интерес к развитию Exodus DayZ Shop! Этот документ содержит всё необходимое для начала работы.

---

## 📑 Содержание

- [Кодекс поведения](#кодекс-поведения)
- [Быстрый старт](#быстрый-старт)
- [Git Workflow](#git-workflow)
- [Naming Conventions](#naming-conventions)
- [Code Style](#code-style)
- [Conventional Commits](#conventional-commits)
- [Pull Requests](#pull-requests)
- [Сообщение о багах](#сообщение-о-багах)
- [Предложение фич](#предложение-фич)
- [Структура проекта](#структура-проекта)
- [Тестирование](#тестирование)
- [База данных](#база-данных)
- [Edge Functions](#edge-functions)
- [Полезные ресурсы](#полезные-ресурсы)

---

## Кодекс поведения

### ✅ Наши стандарты

- Использование приветливого и инклюзивного языка
- Уважение к различным точкам зрения и опыту
- Конструктивная критика с предложениями улучшений
- Фокус на том, что лучше для сообщества
- Эмпатия к другим участникам проекта

### ❌ Неприемлемое поведение

- Оскорбления, троллинг, уничижительные комментарии
- Харассмент в любой форме
- Публикация личной информации без согласия
- Другое неэтичное или непрофессиональное поведение

Нарушители могут быть временно или навсегда заблокированы.

---

## Быстрый старт

### Требования

- Node.js 20+ 
- npm 10+ или Bun
- Git 2.40+
- VS Code (рекомендуется)

### Установка

```bash
# 1. Форкните репозиторий на GitHub

# 2. Клонируйте свой форк
git clone https://github.com/YOUR-USERNAME/exodus-dayz-shop.git
cd exodus-dayz-shop

# 3. Добавьте upstream remote
git remote add upstream https://github.com/original/exodus-dayz-shop.git

# 4. Установите зависимости
npm install

# 5. Создайте .env файл
cp .env.example .env

# 6. Запустите dev-сервер
npm run dev
```

### VS Code расширения

Рекомендуемые расширения (автоматически предлагаются):

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv"
  ]
}
```

---

## Git Workflow

### Branches

Мы используем **GitHub Flow**:

```
main (production)
  └── feature/feature-name
  └── fix/bug-description
  └── docs/documentation-update
  └── refactor/code-improvement
  └── test/add-tests
```

### Создание ветки

```bash
# Синхронизируйте с upstream
git fetch upstream
git checkout main
git merge upstream/main

# Создайте новую ветку
git checkout -b feature/amazing-feature
```

### Naming веток

| Тип | Префикс | Пример |
|-----|---------|--------|
| Новая функция | `feature/` | `feature/cart-promo-codes` |
| Исправление бага | `fix/` | `fix/steam-login-redirect` |
| Документация | `docs/` | `docs/api-reference` |
| Рефакторинг | `refactor/` | `refactor/extract-hooks` |
| Тесты | `test/` | `test/cart-unit-tests` |
| Hotfix | `hotfix/` | `hotfix/payment-crash` |

### Синхронизация

```bash
# Регулярно обновляйте свою ветку
git fetch upstream
git rebase upstream/main

# Или merge (если есть конфликты)
git merge upstream/main
```

---

## Naming Conventions

### Файлы и папки

| Тип | Конвенция | Пример |
|-----|-----------|--------|
| React компоненты | PascalCase | `ProductCard.tsx` |
| Страницы | PascalCase | `ProductDetail.tsx` |
| Хуки | camelCase, use* | `useCart.ts` |
| Утилиты | camelCase | `formatPrice.ts` |
| Контексты | PascalCase + Context | `CartContext.tsx` |
| Тесты | *.test.ts(x) | `Button.test.tsx` |
| Стили (если есть) | kebab-case | `product-card.css` |

### Переменные и функции

```typescript
// ✅ Правильно
const userName = 'John';
const isActive = true;
const productList = [];
const MAX_ITEMS = 100;
const API_URL = 'https://...';

function calculateTotal() { }
function handleClick() { }
function formatPrice(price: number) { }

// ❌ Неправильно
const user_name = 'John';
const UserName = 'John';
const ISACTIVE = true;
```

### React компоненты

```typescript
// ✅ Именованные экспорты
export const ProductCard = () => { };
export const useCart = () => { };

// ❌ Default exports (избегать)
export default ProductCard;
```

### Типы и интерфейсы

```typescript
// ✅ Интерфейсы для объектов
interface UserProps {
  name: string;
  email: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
}

// ✅ Type aliases для union/intersection
type PaymentMethod = 'balance' | 'wayforpay' | 'nowpayments';
type ButtonVariant = 'default' | 'destructive' | 'outline';

// ❌ Избегать
interface IUserProps { }  // Нет префикса I
type TUser = { }          // Нет префикса T
```

---

## Code Style

### TypeScript

```typescript
// ✅ Явная типизация пропсов
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}

const Button = ({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'default' 
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'destructive' && 'bg-destructive'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

// ❌ Избегать any
const Button = (props: any) => { };
```

### React Hooks

```typescript
// ✅ Правильный порядок хуков
const ProductCard = ({ productId }: Props) => {
  // 1. useState
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 2. useContext
  const { user } = useAuth();
  
  // 3. Custom hooks
  const { addToCart } = useCart();
  const { data: product } = useProduct(productId);
  
  // 4. useEffect
  useEffect(() => {
    // side effects
  }, [productId]);
  
  // 5. useMemo/useCallback
  const discountedPrice = useMemo(() => 
    calculateDiscount(product?.price), 
    [product?.price]
  );
  
  // 6. Handlers
  const handleAddToCart = () => {
    addToCart(productId);
  };
  
  // 7. Render
  return <div>...</div>;
};
```

### Tailwind CSS

```tsx
// ✅ Семантические токены (из design system)
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Primary Button
  </button>
  <button className="bg-secondary text-secondary-foreground">
    Secondary Button
  </button>
  <span className="text-muted-foreground">
    Muted text
  </span>
</div>

// ✅ Группировка классов (логический порядок)
<div className={cn(
  // Layout
  "flex items-center justify-between",
  // Spacing
  "p-4 gap-4",
  // Sizing
  "w-full max-w-md",
  // Colors
  "bg-card text-card-foreground",
  // Border
  "rounded-lg border border-border",
  // Effects
  "shadow-sm hover:shadow-md",
  // Transitions
  "transition-shadow duration-200"
)}>

// ❌ Прямые цвета (нарушает тему)
<div className="bg-white text-black">
  <button className="bg-blue-500 text-white">
    Button
  </button>
</div>
```

### Условный рендеринг

```tsx
// ✅ Короткое замыкание для простых условий
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{items.length > 0 && <ItemList items={items} />}

// ✅ Тернарный для if/else
{isLoading ? <Spinner /> : <Content />}

// ✅ Early return для сложных условий
const ProductCard = ({ product }: Props) => {
  if (!product) {
    return <ProductSkeleton />;
  }
  
  if (product.isDeleted) {
    return <DeletedProduct />;
  }
  
  return <div>...</div>;
};

// ❌ Избегать вложенных тернарных
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Content /> : null}
```

---

## Conventional Commits

Мы используем [Conventional Commits](https://www.conventionalcommits.org/ru/).

### Формат

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Типы

| Тип | Описание | Пример |
|-----|----------|--------|
| `feat` | Новая функция | `feat(cart): add promo code support` |
| `fix` | Исправление бага | `fix(auth): resolve Steam login redirect` |
| `docs` | Документация | `docs: update API reference` |
| `style` | Форматирование | `style: fix indentation in ProductCard` |
| `refactor` | Рефакторинг | `refactor(hooks): extract useCart logic` |
| `perf` | Производительность | `perf(images): add lazy loading` |
| `test` | Тесты | `test(cart): add unit tests` |
| `build` | Сборка | `build: update vite config` |
| `ci` | CI/CD | `ci: add coverage reporting` |
| `chore` | Рутина | `chore: update dependencies` |
| `revert` | Откат | `revert: feat(cart): add promo codes` |

### Scope (необязательно)

- `auth` — авторизация
- `cart` — корзина
- `checkout` — оформление заказа
- `products` — товары
- `admin` — админ-панель
- `ui` — UI компоненты
- `hooks` — хуки
- `api` — Edge Functions
- `db` — база данных
- `deps` — зависимости

### Примеры

```bash
# Простой коммит
git commit -m "feat(cart): add quantity controls"

# С телом
git commit -m "fix(auth): resolve Steam login redirect

The Steam OpenID return URL was incorrectly constructed
when the app was served from a subdirectory.

Closes #123"

# Breaking change
git commit -m "feat(api)!: change payment webhook format

BREAKING CHANGE: Payment webhooks now use camelCase
instead of snake_case for field names."
```

### Автоматизация

Для проверки коммитов можно использовать:

```bash
# Установка commitlint
npm install -D @commitlint/{config-conventional,cli}

# .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"]
}
```

---

## Pull Requests

### Перед созданием PR

```bash
# 1. Синхронизируйте с upstream
git fetch upstream
git rebase upstream/main

# 2. Проверьте линтер
npm run lint

# 3. Проверьте типы
npx tsc --noEmit

# 4. Запустите тесты
npm run test

# 5. Проверьте билд
npm run build
```

### Checklist

- [ ] Код проходит линтер без ошибок
- [ ] TypeScript компилируется без ошибок
- [ ] Все тесты проходят
- [ ] Добавлены новые тесты (если нужно)
- [ ] Обновлена документация (если нужно)
- [ ] Коммиты следуют Conventional Commits
- [ ] Ветка синхронизирована с main
- [ ] PR имеет понятное описание

### Шаблон PR

```markdown
## Описание

Краткое описание изменений и их причин.

## Тип изменений

- [ ] 🐛 Bug fix (изменение, исправляющее баг)
- [ ] ✨ New feature (изменение, добавляющее функционал)
- [ ] 💥 Breaking change (изменение, ломающее обратную совместимость)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI update
- [ ] ♻️ Refactoring
- [ ] ✅ Tests

## Связанные Issues

Closes #123
Fixes #456
Related to #789

## Скриншоты (для UI изменений)

| До | После |
|-----|-------|
| screenshot | screenshot |

## Как тестировать

1. Перейти на страницу X
2. Нажать кнопку Y
3. Ожидаемый результат: Z

## Checklist

- [ ] Код соответствует code style
- [ ] Self-review проведён
- [ ] Тесты добавлены/обновлены
- [ ] Документация обновлена
```

### Review Process

1. Создайте PR в main
2. Автоматически запустятся CI проверки
3. Запросите review у maintainers
4. Ответьте на комментарии
5. После approval — squash & merge

---

## Сообщение о багах

### Перед созданием Issue

1. ✅ Проверьте [существующие issues](https://github.com/your-username/exodus-dayz-shop/issues)
2. ✅ Обновите до последней версии
3. ✅ Очистите кэш (`rm -rf node_modules && npm install`)
4. ✅ Проверьте консоль браузера на ошибки

### Шаблон Bug Report

```markdown
## 🐛 Описание бага

Чёткое описание проблемы.

## Шаги для воспроизведения

1. Перейти на страницу '...'
2. Нажать на '...'
3. Прокрутить до '...'
4. Увидеть ошибку '...'

## Ожидаемое поведение

Что должно было произойти.

## Фактическое поведение

Что произошло вместо этого.

## Скриншоты / Видео

Если применимо, добавьте скриншоты или видео.

## Консоль

```
Вставьте ошибки из консоли браузера
```

## Окружение

- OS: [e.g. Windows 11, macOS 14]
- Browser: [e.g. Chrome 120, Firefox 121]
- Node.js: [e.g. 20.10.0]
- npm: [e.g. 10.2.0]

## Дополнительный контекст

Любая другая информация, которая может помочь.
```

---

## Предложение фич

### Шаблон Feature Request

```markdown
## ✨ Описание фичи

Краткое описание предлагаемой функции.

## Проблема

Какую проблему это решает? Опишите use case.

## Предлагаемое решение

Как это должно работать? Опишите желаемое поведение.

## Альтернативы

Какие альтернативные решения вы рассматривали?

## Mockups / Wireframes

Если есть, добавьте визуальные примеры.

## Дополнительный контекст

Любая другая информация.
```

---

## Структура проекта

```
exodus-dayz-shop/
├── .github/
│   └── workflows/          # GitHub Actions
│       ├── ci.yml          # Lint, test, build
│       └── deploy.yml      # Deployment
├── public/
│   ├── banners/            # Баннеры
│   ├── workshop/           # Workshop изображения
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker
│   └── robots.txt          # SEO
├── scripts/
│   ├── database-dump.sql   # Дамп БД
│   └── seed-data.sql       # Тестовые данные
├── src/
│   ├── assets/             # Изображения (import)
│   ├── components/
│   │   ├── admin/          # Компоненты админки
│   │   ├── auth/           # Авторизация
│   │   ├── cart/           # Корзина
│   │   └── ui/             # shadcn/ui компоненты
│   ├── contexts/           # React контексты
│   ├── data/               # Статические данные
│   ├── hooks/              # Кастомные хуки
│   ├── integrations/
│   │   └── supabase/       # Supabase клиент и типы
│   ├── lib/                # Утилиты
│   ├── pages/              # Страницы
│   ├── test/               # Test utilities
│   ├── App.tsx             # Root компонент
│   ├── index.css           # Global styles + tokens
│   └── main.tsx            # Entry point
├── supabase/
│   ├── config.toml         # Supabase config
│   └── functions/          # Edge Functions
│       ├── create-order/
│       ├── wayforpay-payment/
│       └── ...
├── .env.example            # Пример переменных
├── docker-compose.yml      # Docker config
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development
├── tailwind.config.ts      # Tailwind config
├── vite.config.ts          # Vite config
└── vitest.config.ts        # Test config
```

### Где размещать код

| Что создаёте | Куда класть |
|--------------|-------------|
| Новая страница | `src/pages/` |
| UI компонент (переиспользуемый) | `src/components/ui/` |
| Бизнес-компонент | `src/components/` |
| Компонент админки | `src/components/admin/` |
| Компонент корзины | `src/components/cart/` |
| Кастомный хук | `src/hooks/` |
| Утилита | `src/lib/` |
| Контекст | `src/contexts/` |
| Edge Function | `supabase/functions/` |

---

## Тестирование

### Запуск тестов

```bash
# Все тесты
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# CI mode
npm run test:ci
```

### Написание тестов

```typescript
// src/components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Тестирование хуков

```typescript
// src/hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCart } from './useCart';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('useCart', () => {
  it('adds item to cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await act(async () => {
      result.current.addItem({
        product_id: '1',
        quantity: 1,
        price: 100,
      });
    });
    
    expect(result.current.items).toHaveLength(1);
  });
});
```

---

## База данных

### Миграции

```sql
-- supabase/migrations/20240115_add_feature.sql
-- Добавление новой таблицы или изменений

-- Создание таблицы
CREATE TABLE public.new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Включение RLS
ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Users can view own data"
  ON public.new_feature
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Типы

После изменений в БД типы обновляются автоматически в:
```
src/integrations/supabase/types.ts
```

⚠️ **НЕ редактируйте этот файл вручную!**

---

## Edge Functions

### Создание функции

```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Ваша логика здесь
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(10);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Полезные ресурсы

### Документация

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Supabase](https://supabase.com/docs)
- [Vitest](https://vitest.dev/)

### Инструменты

- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind Play](https://play.tailwindcss.com/)
- [Regex101](https://regex101.com/)

### Стиль кода

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## Контакты

- 📚 [Документация](./README.md)
- 🐛 [Issues](https://github.com/your-username/exodus-dayz-shop/issues)
- 💬 [Discussions](https://github.com/your-username/exodus-dayz-shop/discussions)

---

## Благодарности

Спасибо всем контрибьюторам! 🎉

<a href="https://github.com/your-username/exodus-dayz-shop/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=your-username/exodus-dayz-shop" />
</a>

---

*Последнее обновление: Январь 2026*
