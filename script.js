// Ждем, пока вся структура страницы (DOM) будет готова
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP ---
    // Получаем объект WebApp от Telegram
    const tg = window.Telegram.WebApp;

    // Расширяем приложение на всю высоту, чтобы избежать "отскока" при прокрутке
    tg.expand();

    // --- 2. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ СТРАНИЦЫ ---
    const splashScreen = document.getElementById('splash-screen');
    const mainScreen = document.getElementById('main-game-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const tutorialPopup = document.getElementById('tutorial-popup');
    const closeTutorialBtn = document.getElementById('close-tutorial-btn');
    const menuButtons = document.querySelectorAll('.menu-button');

    // --- 3. ФУНКЦИЯ ОБРАБОТКИ НАЧАЛА ИГРЫ ---
    const handleStartGame = () => {
        console.log('Нажата кнопка "Начать игру"');

        // --- Имитация создания аккаунта ---
        // Проверяем, доступны ли данные пользователя Telegram
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            console.log('Создание аккаунта для пользователя:', user);
            console.log('ID:', user.id);
            console.log('Имя:', user.first_name);
            console.log('Ник:', user.username);
            // Здесь в будущем будет логика сохранения данных игрока на сервере,
            // привязанная к user.id
        } else {
            console.log('Данные пользователя Telegram не найдены. Создаем локальный аккаунт.');
            // В качестве запасного варианта для отладки вне Telegram
        }

        // --- Переход между экранами ---
        splashScreen.classList.remove('active');
        mainScreen.classList.add('active');

        // --- Показ обучения ---
        // Проверяем, было ли обучение показано ранее (используем localStorage)
        if (!localStorage.getItem('tutorial_completed')) {
            setTimeout(() => {
                tutorialPopup.classList.add('active');
            }, 500); // Небольшая задержка для плавного появления
        }
    };

    // --- 4. ФУНКЦИЯ ЗАКРЫТИЯ ОБУЧЕНИЯ ---
    const handleCloseTutorial = () => {
        tutorialPopup.classList.remove('active');
        // Записываем в localStorage, что обучение пройдено
        localStorage.setItem('tutorial_completed', 'true');
        console.log('Обучение завершено и сохранено.');
    };
    
    // --- 5. ОБРАБОТКА НАЖАТИЙ НА КНОПКИ МЕНЮ ---
    const handleMenuClick = (event) => {
        const action = event.target.dataset.action;
        if (action) {
            console.log(`Нажата кнопка меню: ${action}`);
            
            // Виброотклик от Telegram для ощущения "нативности"
            tg.HapticFeedback.impactOccurred('light');

            // В будущем здесь будет открываться соответствующий раздел игры
            alert(`Вы вошли в: ${event.target.textContent}`);
        }
    };

    // --- 6. НАЗНАЧЕНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ ---
    startGameBtn.addEventListener('click', handleStartGame);
    closeTutorialBtn.addEventListener('click', handleCloseTutorial);
    menuButtons.forEach(button => {
        button.addEventListener('click', handleMenuClick);
    });

    // --- 7. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
    // Уведомляем Telegram, что приложение готово к отображению
    tg.ready();
    console.log('Приложение готово!');

});
