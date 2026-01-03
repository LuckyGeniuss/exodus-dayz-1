-- Add Telegram settings to admin_settings
INSERT INTO admin_settings (key, value, description, is_encrypted)
VALUES 
  ('TELEGRAM_BOT_TOKEN', null, 'Токен Telegram бота для сповіщень', true),
  ('TELEGRAM_CHAT_ID', null, 'ID чату/групи Telegram для сповіщень', false)
ON CONFLICT (key) DO NOTHING;