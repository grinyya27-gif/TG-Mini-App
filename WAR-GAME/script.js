const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем на все окно

const startBtn = document.getElementById('start-btn');
const splashScreen = document.getElementById('splash-screen');
const mainMenu = document.getElementById('main-menu');
const tutorial = document.getElementById('tutorial');
const closeTutorial = document.getElementById('close-tutorial');

// Инициализация данных пользователя
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    document.getElementById('username').innerText = tg.initDataUnsafe.user.first_name;
    // Можно также загрузить фото: tg.initDataUnsafe.user.photo_url
}

// Нажать "Начать игру"
startBtn.addEventListener('click', () => {
    // Здесь должна быть логика регистрации/привязки к БД через API
    splashScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    tutorial.classList.remove('hidden'); // Показываем обучение при первом входе
});

// Закрыть обучение
closeTutorial.addEventListener('click', () => {
    tutorial.classList.add('hidden');
    tg.HapticFeedback.impactOccurred('medium'); // Виброотклик
});

// Обработка кнопок меню
document.querySelectorAll('.menu-item').forEach(button => {
    button.addEventListener('click', () => {
        const location = button.getAttribute('data-loc');
        console.log("Переход в локацию: " + location);
        tg.HapticFeedback.selectionChanged();
        
        // Здесь можно открывать новые окна или менять контент
        alert("Вы перешли в: " + button.innerText);
    });
});
