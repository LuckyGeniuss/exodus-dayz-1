# 🤝 Руководство по вкладу в проект

Спасибо за интерес к развитию Exodus DayZ Shop! Этот документ поможет вам начать.

---

## 📑 Содержание

- [Кодекс поведения](#кодекс-поведения)
- [Как внести вклад](#как-внести-вклад)
- [Сообщение о багах](#сообщение-о-багах)
- [Предложение фич](#предложение-фич)
- [Pull Requests](#pull-requests)
- [Стиль кода](#стиль-кода)
- [Коммиты](#коммиты)
- [Структура проекта](#структура-проекта)

---

## Кодекс поведения

### Наши стандарты

- Использование приветливого и инклюзивного языка
- Уважение к различным точкам зрения
- Конструктивная критика
- Фокус на том, что лучше для сообщества
- Эмпатия к другим участникам

### Неприемлемое поведение

- Оскорбления, троллинг, уничижительные комментарии
- Харассмент в любой форме
- Публикация личной информации без согласия
- Другое неэтичное или непрофессиональное поведение

---

## Как внести вклад

### 1. Форк репозитория

```bash
# Форкните репозиторий через GitHub UI
# Затем клонируйте свой форк
git clone https://github.com/your-username/exodus-dayz-shop.git
cd exodus-dayz-shop
```

### 2. Создайте ветку

```bash
# Для фичи
git checkout -b feature/amazing-feature

# Для фикса
git checkout -b fix/bug-description

# Для документации
git checkout -b docs/update-readme
```

### 3. Внесите изменения

```bash
# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev

# Внесите изменения...
```

### 4. Проверьте код

```bash
# Запустите линтер
npm run lint

# Проверьте TypeScript
npx tsc --noEmit

# Запустите билд
npm run build
```

### 5. Закоммитьте и запушьте

```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

### 6. Откройте Pull Request

Перейдите на GitHub и откройте PR из вашей ветки в `main`.

---

## Сообщение о багах

### Перед созданием Issue

1. Проверьте, нет ли уже похожего issue
2. Обновите зависимости (`npm install`)
3. Очистите кэш (`rm -rf node_modules && npm install`)

### Шаблон Bug Report

```markdown
## Описание бага
Краткое описание проблемы.

## Шаги для воспроизведения
1. Перейти на '...'
2. Нажать на '...'
3. Прокрутить до '...'
4. Увидеть ошибку

## Ожидаемое поведение
Что должно было произойти.

## Скриншоты
Если применимо, добавьте скриншоты.

## Окружение
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node.js: [e.g. 20.10.0]

## Дополнительный контекст
Любая другая информация о проблеме.
```

---

## Предложение фич

### Шаблон Feature Request

```markdown
## Описание фичи
Краткое описание предлагаемой функции.

## Проблема
Какую проблему это решает?

## Предлагаемое решение
Как это должно работать?

## Альтернативы
Какие альтернативные решения вы рассматривали?

## Дополнительный контекст
Любая другая информация или скриншоты.
```

---

## Pull Requests

### Требования к PR

- [ ] Код проходит линтер (`npm run lint`)
- [ ] Код компилируется без ошибок (`npm run build`)
- [ ] Добавлены/обновлены тесты (если применимо)
- [ ] Обновлена документация (если нужно)
- [ ] Коммиты следуют конвенции
- [ ] PR имеет понятное описание

### Шаблон PR

```markdown
## Описание
Краткое описание изменений.

## Тип изменений
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Связанные Issues
Closes #123

## Чеклист
- [ ] Код проходит линтер
- [ ] Добавлены/обновлены тесты
- [ ] Обновлена документация

## Скриншоты (если UI изменения)
До | После
---|---
img | img
```

---

## Стиль кода

### TypeScript

```typescript
// ✅ Хорошо
interface UserProps {
  name: string;
  email: string;
  isAdmin?: boolean;
}

const UserCard = ({ name, email, isAdmin = false }: UserProps) => {
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
      {isAdmin && <Badge>Admin</Badge>}
    </div>
  );
};

// ❌ Плохо
const UserCard = (props: any) => {
  return <div><h3>{props.name}</h3></div>
}
```

### React компоненты

```typescript
// ✅ Используйте функциональные компоненты
const MyComponent = () => {
  const [state, setState] = useState(false);
  
  return <div>...</div>;
};

// ✅ Используйте именованные экспорты
export const MyComponent = () => { ... };

// ✅ Деструктуризация пропсов
const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  // ...
};
```

### Tailwind CSS

```tsx
// ✅ Используйте семантические токены
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>

// ❌ Избегайте прямых цветов
<div className="bg-white text-black">
  <button className="bg-blue-500 text-white">
    Click me
  </button>
</div>
```

### Именование

| Тип | Конвенция | Пример |
|-----|-----------|--------|
| Компоненты | PascalCase | `UserCard.tsx` |
| Хуки | camelCase, use* | `useAuth.ts` |
| Утилиты | camelCase | `formatPrice.ts` |
| Константы | UPPER_SNAKE | `MAX_ITEMS` |
| Типы/Интерфейсы | PascalCase | `UserProps` |

---

## Коммиты

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Типы

| Тип | Описание |
|-----|----------|
| `feat` | Новая функция |
| `fix` | Исправление бага |
| `docs` | Документация |
| `style` | Форматирование |
| `refactor` | Рефакторинг |
| `test` | Тесты |
| `chore` | Рутинные задачи |

### Примеры

```bash
# Фича
git commit -m "feat(cart): add promo code support"

# Фикс
git commit -m "fix(auth): resolve Steam login redirect issue"

# Документация
git commit -m "docs: update installation instructions"

# Рефакторинг
git commit -m "refactor(hooks): extract useCart logic"
```

---

## Структура проекта

```
src/
├── components/          # React компоненты
│   ├── admin/           # Админ-панель
│   ├── auth/            # Авторизация
│   ├── cart/            # Корзина
│   └── ui/              # UI библиотека
├── hooks/               # Кастомные хуки
├── pages/               # Страницы
├── contexts/            # React контексты
├── data/                # Статические данные
├── integrations/        # Интеграции
└── lib/                 # Утилиты
```

### Где размещать код

| Тип | Расположение |
|-----|--------------|
| Страница | `src/pages/` |
| UI компонент | `src/components/ui/` |
| Бизнес-компонент | `src/components/` |
| Админ-компонент | `src/components/admin/` |
| Хук | `src/hooks/` |
| Утилита | `src/lib/` |

---

## Полезные команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Линтинг
npm run lint

# Проверка типов
npx tsc --noEmit

# Форматирование (если настроен Prettier)
npx prettier --write .
```

---

## Вопросы?

- 📚 [Документация](./README.md)
- 💬 [Discord](https://discord.gg/your-server)
- 🐛 [Issues](https://github.com/your-username/exodus-dayz-shop/issues)

---

Спасибо за ваш вклад! 🎉
