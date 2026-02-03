// api/check-subscription.js
// Vercel Serverless Function для проверки подписки на Telegram канал

const axios = require('axios');

const BOT_TOKEN = '7981866588:AAFULkjvwz3axaFOYqRNXtl27lO1rSaPXyg';
const CHANNEL_ID = '@MedievalLegacy';

module.exports = async (req, res) => {
    // Разрешаем CORS для всех доменов
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка preflight запроса
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Проверка метода
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, username } = req.body;

        // Проверка userId
        if (!userId) {
            return res.status(400).json({
                subscribed: false,
                error: 'User ID is required'
            });
        }

        console.log(`Checking subscription for user ${userId} (${username || 'no username'})`);

        // Запрос к Telegram Bot API
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
            {
                params: {
                    chat_id: CHANNEL_ID,
                    user_id: userId
                },
                timeout: 10000
            }
        );

        // Проверка статуса подписки
        const status = response.data.result.status;
        const subscribed = ['creator', 'administrator', 'member'].includes(status);

        console.log(`User ${userId} status: ${status}, subscribed: ${subscribed}`);

        return res.status(200).json({
            subscribed: subscribed,
            status: status
        });

    } catch (error) {
        console.error('Error checking subscription:', error.message);

        // Обработка ошибок Telegram API
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Пользователь не найден в канале
            if (errorData.description && errorData.description.includes('user not found')) {
                return res.status(200).json({
                    subscribed: false,
                    status: 'not_member'
                });
            }

            // Бот не администратор
            if (errorData.description && errorData.description.includes('not enough rights')) {
                return res.status(500).json({
                    subscribed: false,
                    error: 'Bot is not administrator in the channel'
                });
            }
        }

        // Общая ошибка
        return res.status(500).json({
            subscribed: false,
            error: error.message
        });
    }
};
