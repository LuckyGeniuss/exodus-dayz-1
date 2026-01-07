-- ============================================
-- EXODUS DAYZ SHOP - SEED DATA
-- Version: 2.0.0
-- ============================================
-- This file contains sample data for testing
-- and demonstration purposes.
-- ============================================

-- ============================================
-- LOYALTY LEVELS
-- ============================================

INSERT INTO public.loyalty_levels (name, min_spent, discount_percent, cashback_percent, icon, color, benefits) VALUES
('Новачок', 0, 0, 0, '🌱', '#71717a', '["Базовий доступ до магазину"]'),
('Бронза', 500, 3, 1, '🥉', '#cd7f32', '["3% знижка", "1% кешбек"]'),
('Срібло', 2000, 5, 2, '🥈', '#c0c0c0', '["5% знижка", "2% кешбек", "Ранній доступ до розпродажів"]'),
('Золото', 5000, 7, 3, '🥇', '#ffd700', '["7% знижка", "3% кешбек", "Пріоритетна підтримка"]'),
('Платина', 10000, 10, 5, '💎', '#e5e4e2', '["10% знижка", "5% кешбек", "Ексклюзивні пропозиції", "VIP підтримка"]'),
('Легенда', 25000, 15, 7, '👑', '#9333ea', '["15% знижка", "7% кешбек", "Персональний менеджер", "Унікальні бонуси"]')
ON CONFLICT DO NOTHING;

-- ============================================
-- ACHIEVEMENTS
-- ============================================

INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, reward_balance, is_active) VALUES
('Перша покупка', 'Здійсніть першу покупку в магазині', '🛒', 'shopping', 'orders_count', 1, 25, true),
('Постійний клієнт', 'Здійсніть 5 покупок', '🔄', 'shopping', 'orders_count', 5, 50, true),
('Шопоголік', 'Здійсніть 20 покупок', '🛍️', 'shopping', 'orders_count', 20, 150, true),
('Перший відгук', 'Залиште перший відгук про товар', '⭐', 'engagement', 'reviews_count', 1, 15, true),
('Критик', 'Залиште 10 відгуків', '📝', 'engagement', 'reviews_count', 10, 75, true),
('Реферал', 'Запросіть одного друга', '👥', 'social', 'referrals_count', 1, 50, true),
('Амбасадор', 'Запросіть 5 друзів', '🌟', 'social', 'referrals_count', 5, 200, true),
('Щоденна серія', 'Заберіть щоденний бонус 7 днів поспіль', '🔥', 'loyalty', 'daily_streak', 7, 100, true),
('Колекціонер', 'Додайте 10 товарів у список бажань', '💝', 'engagement', 'wishlist_count', 10, 30, true),
('Велика витрата', 'Витратьте понад 1000₴ за одне замовлення', '💰', 'shopping', 'single_order_amount', 1000, 100, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================

INSERT INTO public.products (name, description, price, original_price, category, subcategory, image_url, in_stock, is_featured, is_new, is_popular) VALUES
-- Vehicles
('Ada 4x4', 'Повнопривідний позашляховик для виживання в будь-яких умовах', 750, 850, 'vehicles', 'cars', '/assets/products/vehicle-ada.jpg', true, true, false, true),
('Gunter 2', 'Швидкий та надійний седан для швидкого пересування', 500, null, 'vehicles', 'cars', '/assets/products/vehicle-gunter.jpg', true, false, false, true),
('Olga 24', 'Класичний автомобіль з великим багажником', 450, 500, 'vehicles', 'cars', '/assets/products/vehicle-olga-gen.jpg', true, false, true, false),
('Sarka 120', 'Компактний міський автомобіль', 400, null, 'vehicles', 'cars', '/assets/products/vehicle-sarka.jpg', true, false, false, false),
('V3S Cargo', 'Вантажівка для перевезення великих обсягів', 900, 1000, 'vehicles', 'trucks', '/assets/products/vehicle-v3s.jpg', true, true, false, true),
('HMMWV', 'Військовий позашляховик підвищеної прохідності', 1200, null, 'vehicles', 'military', '/assets/products/vehicle-hmmwv-gen.jpg', true, true, true, true),
('Човен', 'Моторний човен для водних подорожей', 600, null, 'vehicles', 'boats', '/assets/products/vehicle-boat-gen.jpg', true, false, true, false),

-- Building Materials
('Кодовий замок', 'Захистіть вашу базу надійним замком', 150, null, 'building', 'security', '/assets/products/build-codelock.jpg', true, false, false, true),
('Цвяхи (100 шт)', 'Будівельні цвяхи для укріплень', 75, 90, 'building', 'materials', '/assets/products/build-nails.jpg', true, false, false, true),
('Камуфляжна сітка', 'Приховайте вашу базу від ворогів', 200, null, 'building', 'camouflage', '/assets/products/build-camonet-gen.jpg', true, true, false, false),
('Флагшток', 'Позначте вашу територію', 100, null, 'building', 'decoration', '/assets/products/build-flagpole-gen.jpg', true, false, true, false),

-- Containers
('Велика скриня', 'Збережіть ваші запаси в безпеці', 250, 300, 'containers', 'storage', '/assets/products/container-chest.jpg', true, true, false, true),
('Шафа для зброї', 'Організоване зберігання зброї', 350, null, 'containers', 'weapons', '/assets/products/container-weaponrack.jpg', true, false, true, false),
('Шафка', 'Компактне зберігання особистих речей', 180, null, 'containers', 'storage', '/assets/products/container-locker-gen.jpg', true, false, false, false),
('Ящик', 'Базовий контейнер для зберігання', 120, null, 'containers', 'storage', '/assets/products/container-crate-gen.jpg', true, false, false, true),

-- Parts
('Акумулятор', 'Заряджений автомобільний акумулятор', 180, 200, 'parts', 'electrical', '/assets/products/parts-battery.jpg', true, false, false, true),
('Радіатор', 'Система охолодження для транспорту', 220, null, 'parts', 'mechanical', '/assets/products/parts-radiator-gen.jpg', true, false, true, false),

-- Kits
('Стартовий набір', 'Все необхідне для початку виживання', 500, 650, 'kits', 'starter', '/assets/products/kit-starter-gen.jpg', true, true, false, true),
('Набір для двох', 'Подвійний набір для гри з другом', 900, 1100, 'kits', 'duo', '/assets/products/kit-duo.jpg', true, true, true, true),
('Великий набір', 'Максимальний комплект спорядження', 1500, 1800, 'kits', 'premium', '/assets/products/kit-big.jpg', true, true, false, true),

-- VIP
('VIP Місяць', 'Преміум статус на 30 днів', 300, null, 'vip', 'subscription', '/assets/products/priority-month.jpg', true, true, false, true),
('VIP Рік', 'Преміум статус на 365 днів', 2500, 3600, 'vip', 'subscription', '/assets/products/priority-vip-gen.jpg', true, true, true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- HOMEPAGE BANNERS
-- ============================================

INSERT INTO public.homepage_banners (title, subtitle, image_url, link_url, button_text, sort_order, is_active) VALUES
('Новий сезон', 'Оновлення магазину з новими товарами та акціями', '/banners/starter-kit.jpg', '/shop?category=kits', 'Переглянути', 1, true),
('VIP Привілеї', 'Отримайте ексклюзивні переваги з VIP статусом', '/banners/vip-priority.jpg', '/shop?category=vip', 'Дізнатися більше', 2, true),
('Транспорт', 'Великий вибір транспортних засобів', '/banners/street-warrior.jpg', '/shop?category=vehicles', 'До транспорту', 3, true),
('Будівництво бази', 'Все для захисту вашої території', '/banners/building-kit.jpg', '/shop?category=building', 'Будувати', 4, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE PROMO CODES
-- ============================================

INSERT INTO public.promo_codes (code, discount_percent, max_uses, valid_from, valid_until, is_active) VALUES
('WELCOME10', 10, 100, now(), now() + interval '30 days', true),
('SUMMER25', 25, 50, now(), now() + interval '14 days', true),
('VIP50', 50, 10, now(), now() + interval '7 days', true),
('FRIEND15', 15, null, now(), now() + interval '60 days', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ADMIN SETTINGS
-- ============================================

INSERT INTO public.admin_settings (key, value, description, category) VALUES
('site_name', '"Exodus DayZ Shop"', 'Назва сайту', 'general'),
('site_description', '"Магазин для серверів DayZ"', 'Опис сайту', 'general'),
('currency', '"UAH"', 'Валюта магазину', 'general'),
('currency_symbol', '"₴"', 'Символ валюти', 'general'),
('min_order_amount', '50', 'Мінімальна сума замовлення', 'orders'),
('referral_bonus', '50', 'Бонус за реферала', 'referrals'),
('daily_bonus_enabled', 'true', 'Щоденні бонуси увімкнені', 'bonuses'),
('fortune_wheel_enabled', 'true', 'Колесо фортуни увімкнено', 'bonuses'),
('maintenance_mode', 'false', 'Режим технічного обслуговування', 'system')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- CRON JOBS
-- ============================================

INSERT INTO public.cron_jobs (name, description, schedule, function_name, is_active) VALUES
('notify_ending_promotions', 'Сповіщення про закінчення акцій', '0 9 * * *', 'notify-ending-promotions', true),
('send_cart_reminders', 'Нагадування про покинуті кошики', '0 14 * * *', 'send-cart-reminder', true),
('send_recommendations', 'Персональні рекомендації', '0 10 * * 1', 'send-recommendations', true),
('cleanup_old_logs', 'Очищення старих логів', '0 3 * * 0', 'cleanup-logs', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- END OF SEED DATA
-- ============================================
