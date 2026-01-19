const Game = {
  state: {
    gold: 0,
    energy: 100,
    level: 1,
    exp: 0,
    skills: {
      labor: 1
    },
    tools: ['Ржавая топор'],
    questDone: false,
    lastOnline: Date.now()
  },

  save() {
    localStorage.setItem('medieval_save', JSON.stringify(this.state));
  },

  load() {
    const s = localStorage.getItem('medieval_save');
    if (s) this.state = JSON.parse(s);
  },

  updateUI() {
    document.getElementById('gold').textContent = this.state.gold;
    document.getElementById('energy').textContent = this.state.energy;
    document.getElementById('level').textContent = this.state.level;

    const tools = document.getElementById('tools');
    tools.innerHTML = '';
    this.state.tools.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      tools.appendChild(li);
    });
  },

  addExp(x) {
    this.state.exp += x;
    if (this.state.exp >= this.state.level * 10) {
      this.state.exp = 0;
      this.state.level++;
    }
  },

  jobs: {
    start(type) {
      if (Game.state.energy < 10) return;
      Game.state.energy -= 10;
      const gain = 3 + Math.floor(Math.random() * 4);
      Game.state.gold += gain;
      Game.addExp(2);
      document.getElementById('jobStatus').textContent =
        `Вы собрали хворост и заработали ${gain} золота.`;
      Game.save();
      Game.updateUI();
    }
  },

  quests: {
    complete() {
      if (Game.state.questDone) return;
      if (Game.state.gold >= 10) {
        Game.state.gold -= 10;
        Game.state.tools.push('Обычный топор');
        Game.state.questDone = true;
        document.getElementById('questText').textContent =
          'Спасибо. Этот топор прослужит тебе долго.';
        Game.save();
        Game.updateUI();
      }
    }
  }
};

Game.load();
Game.updateUI();
