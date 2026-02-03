// netlify/functions/check-subscription.js
// Netlify Serverless Function для проверки подписки на Telegram канал

const axios = require('axios');

const BOT_TOKEN = '7981866588:AAFULkjvwz3axaFOYqRNXtl27lO1rSaPXyg';
const CHANNEL_ID = '@MedievalLegacy';

exports.handler = async (event, context) => {
    // Разрешаем CORS для всех доменов
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Обработка preflight запроса
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }

    // Проверка метода
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Парсим тело запроса
        const { userId, username } = JSON.parse(event.body || '{}');

        // Проверка userId
        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    subscribed: false,
                    error: 'User ID is required'
                })
            };
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                subscribed: subscribed,
                status: status
            })
        };

    } catch (error) {
        console.error('Error:', error.message);

        // Обработка ошибок Telegram API
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Пользователь не найден в канале
            if (errorData.description && errorData.description.includes('user not found')) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        subscribed: false,
                        status: 'not_member'
                    })
                };
            }

            // Бот не администратор
            if (errorData.description && errorData.description.includes('not enough rights')) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        subscribed: false,
                        error: 'Bot is not administrator in the channel'
                    })
                };
            }
        }

        // Общая ошибка
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                subscribed: false,
                error: error.message
            })
        };
    }
};
