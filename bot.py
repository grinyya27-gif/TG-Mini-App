import json
import os
import logging
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# ВСТАВЬ СЮДА СВОИ ДАННЫЕ:
BOT_TOKEN = 7981866588:AAFULkjvwz3axaFOYqRNXtl27lO1rSaPXyg
ADMIN_ID = 1720880799
# ============================================

USERS_FILE = "users.json"


def load_users() -> dict:
    """Загрузить пользователей из файла."""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_users(users: dict):
    """Сохранить пользователей в файл."""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def save_user(chat_id: int, user):
    """Сохранить одного пользователя."""
    users = load_users()
    users[str(chat_id)] = {
        "user_id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "joined": datetime.now().isoformat(),
        "blocked": False,
    }
    save_users(users)
    logger.info(f"Сохранён: {user.first_name} (@{user.username}), ID: {chat_id}")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start — сохраняет пользователя и приветствует."""
    user = update.effective_user
    chat_id = update.effective_chat.id
    save_user(chat_id, user)

    await update.message.reply_text(
        f"Привет, {user.first_name}! 👋\n"
        f"Ты подписался на рассылку.\n"
        f"Ты будешь получать важные сообщения от нас!"
    )


async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /send — рассылка сообщения всем пользователям.
    Использование: /send Текст сообщения
    """
    if update.effective_user.id != ADMIN_ID:
        await update.message.reply_text("⛔ У вас нет прав.")
        return

    if not context.args:
        await update.message.reply_text(
            "❓ Как использовать:\n/send Текст сообщения"
        )
        return

    text = " ".join(context.args)
    users = load_users()
    success, failed = 0, 0

    for chat_id in users:
        try:
            await context.bot.send_message(chat_id=int(chat_id), text=text)
            success += 1
        except Exception as e:
            logger.warning(f"Не отправлено {chat_id}: {e}")
            users[chat_id]["blocked"] = True
            failed += 1

    save_users(users)
    await update.message.reply_text(
        f"📨 Рассылка завершена!\n"
        f"✅ Доставлено: {success}\n"
        f"❌ Ошибок: {failed}"
    )


async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /stats — статистика бота."""
    if update.effective_user.id != ADMIN_ID:
        return

    users = load_users()
    total = len(users)
    active = sum(1 for u in users.values() if not u.get("blocked"))
    with_username = sum(1 for u in users.values() if u.get("username"))

    await update.message.reply_text(
        f"📊 Статистика бота:\n"
        f"👥 Всего подписчиков: {total}\n"
        f"✅ Активных: {active}\n"
        f"🚫 Заблокировали: {total - active}\n"
        f"@ С username: {with_username}"
    )


async def users_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /users — список всех пользователей."""
    if update.effective_user.id != ADMIN_ID:
        return

    users = load_users()
    if not users:
        await update.message.reply_text("Пока никто не подписался.")
        return

    lines = []
    for chat_id, data in users.items():
        status = "🚫" if data.get("blocked") else "✅"
        name = data.get("first_name", "?")
        uname = f"@{data['username']}" if data.get("username") else "нет username"
        lines.append(f"{status} {name} ({uname}) — ID: {chat_id}")

    # Telegram ограничивает длину сообщения, разбиваем на части
    message = "👥 Подписчики:\n\n" + "\n".join(lines)
    if len(message) > 4000:
        for i in range(0, len(lines), 50):
            chunk = "\n".join(lines[i:i+50])
            await update.message.reply_text(f"👥 Подписчики ({i+1}-{min(i+50, len(lines))}):\n\n{chunk}")
    else:
        await update.message.reply_text(message)


async def handle_any_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Сохраняет пользователя при ЛЮБОМ сообщении боту."""
    user = update.effective_user
    chat_id = update.effective_chat.id
    if user:
        users = load_users()
        if str(chat_id) not in users:
            save_user(chat_id, user)


def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("send", broadcast))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(CommandHandler("users", users_list))
    app.add_handler(MessageHandler(filters.ALL, handle_any_message))

    logger.info("🤖 Бот запущен! Жду сообщения...")
    app.run_polling()


if __name__ == "__main__":
    main()