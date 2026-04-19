# Данные Supabase и Telegram-бота

## Supabase
- **Project URL:** `https://aghexmykhvedbxyqptof.supabase.co`
- **Dashboard:** `https://supabase.com/dashboard/project/aghexmykhvedbxyqptof`
- **DB Host:** `db.aghexmykhvedbxyqptof.supabase.co`
- **User:** `postgres`
- **Password:** `aMt0alNOjN4UCIaH`

### Структура таблиц
Для корректной работы бота и дашборда должны быть созданы следующие таблицы:

```sql
-- Таблица проектов
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица задач
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ
);
```

## Telegram Бот
- **Token:** `8699499848:AAFsGvFlHflfWB1T1Et6B20RfS07I2cakgU`
- **Файл запуска:** `src/bot/server.ts`
- **Команда запуска:** `npx tsx src/bot/server.ts`

### Формат сообщений для бота
Бот реагирует на сообщения, содержащие сумму.
Пример: `Оценить задачу по верстке 500 рублей`
После получения сообщения бот предложит выбрать проект из списка существующих в базе.
