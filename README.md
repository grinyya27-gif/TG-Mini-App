# TG-Mini-App
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Моё первое Mini App</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            text-align: center;
            padding-top: 50px;
        }
        button {
            font-size: 20px;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            background: #2ea6ff;
            color: white;
            cursor: pointer;
        }
    </style>
</head>
<body>

<h1>Привет, Telegram 👋</h1>
<p>Нажатий: <span id="count">0</span></p>

<button onclick="clickMe()">Нажми меня</button>

<script>
    let count = 0;

    function clickMe() {
        count++;
        document.getElementById("count").innerText = count;

        // Сообщаем Telegram, что что-то произошло
        Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }

    // Сообщаем Telegram, что приложение готово
    Telegram.WebApp.ready();
</script>

</body>
</html>
