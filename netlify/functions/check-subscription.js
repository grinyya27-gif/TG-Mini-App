// Netlify Function для проверки подписки на Telegram канал
// Путь: netlify/functions/check-subscription.js

const BOT_TOKEN = '7981866588:AAFULkjvwz3axaFOYqRNXtl27lO1rSaPXyg';
const CHANNEL_USERNAME = '@MedievalLegacy'; // Используйте @username канала

exports.handler = async (event, context) => {
    // Установка CORS заголовков
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Проверка метода запроса
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Парсинг тела запроса
        const { userId, username } = JSON.parse(event.body || '{}');

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'User ID is required',
                    subscribed: false 
                })
            };
        }

        // Проверка подписки через Telegram Bot API
        const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: CHANNEL_USERNAME,
                user_id: userId
            })
        });

        const data = await response.json();

        // Проверка результата
        if (data.ok) {
            const status = data.result.status;
            // Пользователь подписан, если статус: creator, administrator, member
            const isSubscribed = ['creator', 'administrator', 'member'].includes(status);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    subscribed: isSubscribed,
                    status: status,
                    userId: userId,
                    username: username || 'unknown'
                })
            };
        } else {
            // Ошибка от Telegram API
            console.error('Telegram API error:', data);
            
            // Если пользователь не найден в канале (kicked или left)
            if (data.description && (
                data.description.includes('user not found') || 
                data.description.includes('USER_NOT_PARTICIPANT')
            )) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        subscribed: false,
                        status: 'not_member',
                        userId: userId
                    })
                };
            }

            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Telegram API error',
                    description: data.description,
                    subscribed: false
                })
            };
        }
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                subscribed: false
            })
        };
    }
};
