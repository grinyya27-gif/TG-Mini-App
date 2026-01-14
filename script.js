// Ждем, когда страница полностью загрузится
window.addEventListener('load', () => {
    console.log("Страница готова. Запускаем таймер выхода...");

    // Даем игроку посмотреть на заставку 3 секунды
    setTimeout(() => {
        // Ищем элементы по их ID, которые мы прописали в index.html
        const curtain = document.getElementById('app-curtain');
        const app = document.getElementById('app');

        if (curtain) {
            // Плавно растворяем заставку
            curtain.style.opacity = '0';
            
            // Через 1 секунду (время анимации) полностью удаляем заставку и показываем игру
            setTimeout(() => {
                curtain.style.display = 'none';
                if (app) {
                    app.style.display = 'block';
                }
                console.log("Загрузка завершена успешно!");
            }, 1000);
        }
    }, 3000);
});

// Инициализация Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Разворачиваем приложение на весь экран
}
