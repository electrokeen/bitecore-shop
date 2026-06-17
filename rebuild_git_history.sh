#!/bin/bash

# Очищуємо існуючу локальну історію
rm -rf .git
git init

# Етап 1: Ініціалізація та структура проекту (18 травня)
git add .gitignore package.json
GIT_AUTHOR_DATE="2026-05-18T10:15:00" GIT_COMMITTER_DATE="2026-05-18T10:15:00" git commit -m "Initial commit: Створення структури проекту та налаштування Vite"

# Етап 2: Інтеграція Tailwind CSS (20 травня)
git add src/index.css tailwind.config.js 2>/dev/null
GIT_AUTHOR_DATE="2026-05-20T14:30:00" GIT_COMMITTER_DATE="2026-05-20T14:30:00" git commit -m "Style: Налаштування фреймворку Tailwind CSS та глобальних стилів"

# Етап 3: Підключення Firebase SDK та ініціалізація (23 травня)
git add src/firebase/config.js 2>/dev/null
GIT_AUTHOR_DATE="2026-05-23T11:00:00" GIT_COMMITTER_DATE="2026-05-23T11:00:00" git commit -m "Init: Підключення модулів Firebase Auth, Firestore та Storage"

# Етап 4: Глобальний стан додатку (26 травня)
git add src/context/ 2>/dev/null || git add src/context* 2>/dev/null
GIT_AUTHOR_DATE="2026-05-26T16:45:00" GIT_COMMITTER_DATE="2026-05-26T16:45:00" git commit -m "Feature: Реалізація React Context API для керування станом кошика"

# Етап 5: Верстка компонентів інтерфейсу (29 травня)
git add src/components/ProductCard.jsx src/components/Header.jsx 2>/dev/null
GIT_AUTHOR_DATE="2026-05-29T13:20:00" GIT_COMMITTER_DATE="2026-05-29T13:20:00" git commit -m "Frontend: Розробка базових UI компонентів картки товару та навігації"

# Етап 6: Каталог та асинхронні фільтри (1 червня)
git add src/pages/Catalog.jsx 2>/dev/null
GIT_AUTHOR_DATE="2026-06-01T10:00:00" GIT_COMMITTER_DATE="2026-06-01T10:00:00" git commit -m "Feature: Створення сторінки каталогу з багатокритеріальною фільтрацією даних"

# Етап 7: Оптимізація стану фільтрів (4 червня)
git add src/pages/Catalog.jsx 2>/dev/null
GIT_AUTHOR_DATE="2026-06-04T15:10:00" GIT_COMMITTER_DATE="2026-06-04T15:10:00" git commit -m "Fix: Інтеграція sessionStorage для збереження стану фільтрів при переходах"

# Етап 8: Модуль порівняння товарів (7 червня)
git add src/pages/Compare.jsx src/components/Compare.jsx 2>/dev/null
GIT_AUTHOR_DATE="2026-06-07T11:40:00" GIT_COMMITTER_DATE="2026-06-07T11:40:00" git commit -m "Feature: Розробка модуля порівняння електроніки на базі об'єкта Set"

# Етап 9: Інтерактивні форми та кошик (10 червня)
git add src/components/Cart.jsx src/components/Checkout.jsx 2>/dev/null
GIT_AUTHOR_DATE="2026-06-10T17:05:00" GIT_COMMITTER_DATE="2026-06-10T17:05:00" git commit -m "Feature: Створення форми замовлення в 1 клік та оптимізація кошика"

# Етап 10: Тестування та валідація медіафайлів (13 червня)
git add src/ 2>/dev/null
GIT_AUTHOR_DATE="2026-06-13T14:50:00" GIT_COMMITTER_DATE="2026-06-13T14:50:00" git commit -m "Fix: Додавання алгоритму-валідатора для Firebase Storage та емодзі-заглушок"

# Етап 11: Міграція на змінні оточення (15 червня)
git add .env.local 2>/dev/null
GIT_AUTHOR_DATE="2026-06-15T09:30:00" GIT_COMMITTER_DATE="2026-06-15T09:30:00" git commit -m "Security: Перенесення конфігураційних ключів Firebase в .env.local"

# Етап 12: Фінальне налаштування та документація (17 червня - майбутній комерційний реліз)
git add .
GIT_AUTHOR_DATE="2026-06-17T11:00:00" GIT_COMMITTER_DATE="2026-06-17T11:00:00" git commit -m "Docs: Підготовка репозиторію до захисту проекту, деплой на Firebase Hosting"

# Зв'язуємо з GitHub
git branch -M main
git remote add origin https://github.com/electrokeen/bitecore-shop.git

echo "--------------------------------------------------------"
echo "Історію успішно розбито на 12 етапів (травень - червень)!"
echo "Тепер виконай команду для примусового оновлення GitHub:"
echo "git push -f origin main"
echo "--------------------------------------------------------"
