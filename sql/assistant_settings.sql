-- Создание таблицы настроек ассистента
CREATE TABLE IF NOT EXISTS assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- LLM настройки
  llm_api_url TEXT NOT NULL DEFAULT 'https://api.groq.com/openai/v1/chat/completions',
  llm_model TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  llm_api_key TEXT,
  llm_prompt TEXT,
  
  -- Прокси настройки
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_login TEXT,
  proxy_password TEXT
);

-- Добавление колонки если таблица уже существует
-- ALTER TABLE assistant_settings ADD COLUMN IF NOT EXISTS llm_prompt TEXT;

-- Включение RLS
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения и записи
CREATE POLICY "Allow public access" ON assistant_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Вставка начальных данных (если пусто)
INSERT INTO assistant_settings (llm_api_url, llm_model)
SELECT 'https://api.llm.example.com/v1/chat/completions', 'llama-3.3-70b-versatile'
WHERE NOT EXISTS (SELECT 1 FROM assistant_settings);