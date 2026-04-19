import { Telegraf, Context, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Состояния пользователя
type BotStep = 'awaiting_project' | 'awaiting_description' | 'confirm_task';

interface Session {
  title: string;
  amount: number;
  date: Date;
  projectId?: string;
  projectName?: string;
  description?: string;
  step: BotStep;
}

const sessions = new Map<number, Session>();

bot.start((ctx) => {
  sessions.delete(ctx.from.id);
  ctx.reply('Привет! Присылай мне задачи в формате: "Оценить задачу 500 рублей"');
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const session = sessions.get(userId);

  // Если мы ждем описание
  if (session?.step === 'awaiting_description') {
    session.description = text;
    session.step = 'confirm_task';
    sessions.set(userId, session);
    return showSummary(ctx, session);
  }

  // Парсинг новой задачи
  const amountMatch = text.match(/(\d+)\s*(рублей|руб|р|₽)/i);
  
  if (amountMatch) {
    const amount = parseInt(amountMatch[1]);
    const title = text.replace(amountMatch[0], '').trim() || 'Новая задача';
    
    sessions.set(userId, {
      title,
      amount,
      date: new Date(),
      step: 'awaiting_project'
    });

    try {
      const { data: projects, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;

      if (!projects || projects.length === 0) {
        return ctx.reply('В базе пока нет проектов. Создай их в дашборде.');
      }

      const buttons = projects.map(p => Markup.button.callback(p.name, `project_${p.id}:${p.name}`));
      return ctx.reply(`Куда добавить задачу "${title}" (${amount} ₽)?`, Markup.inlineKeyboard(buttons, { columns: 2 }));
    } catch (err) {
      console.error(err);
      return ctx.reply('Ошибка при получении проектов.');
    }
  } else {
    ctx.reply('Не вижу сумму. Напиши, например: "Поправить баг 300 руб"');
  }
});

// Выбор проекта
bot.action(/project_(.+):(.+)/, async (ctx) => {
  const userId = ctx.from?.id || 0;
  const projectId = ctx.match[1];
  const projectName = ctx.match[2];
  const session = sessions.get(userId);

  if (!session || session.step !== 'awaiting_project') {
    return ctx.answerCbQuery('Сессия истекла.');
  }

  session.projectId = projectId;
  session.projectName = projectName;
  session.step = 'awaiting_description';
  sessions.set(userId, session);

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `Проект: **${projectName}**\nТеперь напиши **описание** задачи или нажми кнопку пропустить:`,
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏭ Пропустить описание', 'skip_desc')],
        [Markup.button.callback('❌ Отмена', 'cancel')]
      ])
    }
  );
});

// Пропуск описания
bot.action('skip_desc', async (ctx) => {
  const userId = ctx.from?.id || 0;
  const session = sessions.get(userId);

  if (!session) return ctx.answerCbQuery('Ошибка сессии.');

  session.description = '';
  session.step = 'confirm_task';
  sessions.set(userId, session);

  await ctx.answerCbQuery();
  return showSummary(ctx, session);
});

// Кнопка изменения описания
bot.action('edit_desc', async (ctx) => {
  const userId = ctx.from?.id || 0;
  const session = sessions.get(userId);

  if (!session) return ctx.answerCbQuery('Ошибка сессии.');

  session.step = 'awaiting_description';
  sessions.set(userId, session);

  await ctx.answerCbQuery();
  return ctx.editMessageText('Хорошо, напиши новое описание для задачи:', {
    ...Markup.inlineKeyboard([Markup.button.callback('❌ Отмена', 'cancel')])
  });
});

// Подтверждение и сохранение
bot.action('confirm_save', async (ctx) => {
  const userId = ctx.from?.id || 0;
  const session = sessions.get(userId);

  if (!session || !session.projectId) {
    return ctx.answerCbQuery('Ошибка сессии.');
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .insert([{
        project_id: session.projectId,
        title: session.title,
        amount: session.amount,
        description: session.description || '',
        status: 'todo',
        priority: 'medium'
      }]);

    if (error) throw error;

    sessions.delete(userId);
    await ctx.answerCbQuery();
    return ctx.editMessageText(`✅ Задача успешно добавлена в проект **${session.projectName}**!\n\n**${session.title}**\n💰 ${session.amount} ₽`);
  } catch (err: any) {
    console.error('Ошибка сохранения:', err);
    ctx.reply(`❌ Ошибка БД: ${err.message}`);
  }
});

bot.action('cancel', (ctx) => {
  sessions.delete(ctx.from?.id || 0);
  ctx.answerCbQuery('Отменено');
  ctx.editMessageText('Создание задачи отменено. Присылай новую, когда будешь готов.');
});

// Функция показа резюме
async function showSummary(ctx: any, session: Session) {
  const summary = `📋 **Резюме задачи:**\n\n` +
    `**Название:** ${session.title}\n` +
    `**Сумма:** ${session.amount} ₽\n` +
    `**Проект:** ${session.projectName}\n` +
    `**Описание:** ${session.description || '_не указано_'}\n\n` +
    `Всё верно?`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🚀 Подтвердить и создать', 'confirm_save')],
    [Markup.button.callback('📝 Изменить описание', 'edit_desc')],
    [Markup.button.callback('❌ Отмена', 'cancel')]
  ]);

  if (ctx.callbackQuery) {
    return ctx.editMessageText(summary, { parse_mode: 'Markdown', ...keyboard });
  } else {
    return ctx.reply(summary, { parse_mode: 'Markdown', ...keyboard });
  }
}

bot.launch();
console.log('Бот с подтверждением и коррекцией описания запущен...');
