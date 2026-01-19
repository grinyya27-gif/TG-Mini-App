let state = {
  gold: 1000,
  working: false
};

function saveGame() {
  localStorage.setItem("rpg_state", JSON.stringify(state));
}

function loadGame() {
  const s = localStorage.getItem("rpg_state");
  if (s) state = JSON.parse(s);
}

function updateUI() {
  document.getElementById("gold").textContent = state.gold;
}

function startJob() {
  if (state.working) return;
  state.working = true;
  document.getElementById("status").textContent = "Вы работаете...";
  setTimeout(() => {
    state.gold += 50;
    state.working = false;
    document.getElementById("status").textContent = "Работа завершена! +50 золота";
    saveGame();
    updateUI();
  }, 30000);
}

loadGame();
updateUI();
