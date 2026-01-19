// Telegram init
if (window.Telegram?.WebApp) {
    Telegram.WebApp.ready();
}

// State
const state = {
    gold: 1000,
    gems: 50,
    working: false
};

function saveGame() {
    localStorage.setItem('rpg_state', JSON.stringify(state));
}

function loadGame() {
    const s = localStorage.getItem('rpg_state');
    if (s) Object.assign(state, JSON.parse(s));
}

function updateUI() {
    document.getElementById('goldAmount').textContent = state.gold;
    document.getElementById('gemsAmount').textContent = state.gems;
}

function switchSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function startJob() {
    if (state.working) return;
    state.working = true;
    document.getElementById('jobStatus').textContent = 'Работаю...';

    setTimeout(() => {
        state.gold += 50;
        state.working = false;
        document.getElementById('jobStatus').textContent = 'Работа завершена (+50💰)';
        saveGame();
        updateUI();
        showToast('Работа завершена', 'success');
    }, 3000);
}

function showToast(text, type) {
    alert(text);
}

loadGame();
updateUI();
