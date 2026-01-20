// Medieval RPG Game - Main JavaScript File
// Game Engine Core

class GameEngine {
    constructor() {
        this.player = new Player();
        this.locations = new LocationSystem();
        this.quests = new QuestSystem();
        this.inventory = new InventorySystem();
        this.shop = new ShopSystem();
        this.npcs = new NPCSystem();
        this.jobs = new JobSystem();
        this.combat = new CombatSystem();
        this.crafting = new CraftingSystem();
        this.skills = new SkillSystem();
        
        this.gameTime = {
            day: 1,
            hour: 8,
            minute: 0
        };
        
        this.isRunning = true;
        this.autoSaveInterval = null;
        
        this.init();
    }
    
    init() {
        console.log('Инициализация игры...');
        
        // Загрузка сохраненной игры
        this.loadGame();
        
        // Инициализация интерфейса
        this.initUI();
        
        // Запуск игрового цикла
        this.startGameLoop();
        
        // Автосохранение каждые 30 секунд
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
            this.addLog('Игра автоматически сохранена', 'system');
        }, 30000);
        
        this.addLog('Добро пожаловать в королевство Эльдора!', 'welcome');
        this.addLog('Ваше приключение начинается. Используйте кнопки или команды для взаимодействия.', 'system');
    }
    
    initUI() {
        // Обновление информации о игроке
        this.updatePlayerInfo();
        
        // Загрузка локаций
        this.locations.loadLocations();
        this.updateLocationInfo();
        
        // Загрузка квестов
        this.quests.loadQuests();
        this.updateQuestsUI();
        
        // Загрузка инвентаря
        this.inventory.loadItems();
        this.updateInventoryUI();
        
        // Загрузка магазина
        this.shop.loadShopItems();
        this.updateShopUI();
        
        // Загрузка NPC
        this.npcs.loadNPCs();
        this.updateNPCsUI();
        
        // Загрузка работ
        this.jobs.loadJobs();
        this.updateJobsUI();
        
        // Загрузка навыков
        this.skills.loadSkills();
        this.updateSkillsUI();
        
        // Инициализация обработчиков событий
        this.initEventHandlers();
    }
    
    initEventHandlers() {
        // Основные действия
        document.getElementById('attackBtn').addEventListener('click', () => this.combat.startRandomEncounter());
        document.getElementById('mineBtn').addEventListener('click', () => this.performAction('mine'));
        document.getElementById('forageBtn').addEventListener('click', () => this.performAction('forage'));
        document.getElementById('fishBtn').addEventListener('click', () => this.performAction('fish'));
        document.getElementById('craftBtn').addEventListener('click', () => this.openCrafting());
        document.getElementById('restBtn').addEventListener('click', () => this.performAction('rest'));
        
        // Обновление интерфейса каждую секунду
        setInterval(() => this.updateUI(), 1000);
    }
    
    performAction(action) {
        const currentLocation = this.locations.getCurrentLocation();
        
        switch(action) {
            case 'mine':
                if (currentLocation.actions.includes('mine')) {
                    this.mining();
                } else {
                    this.addLog('Здесь нельзя добывать руду', 'error');
                }
                break;
                
            case 'forage':
                if (currentLocation.actions.includes('forage')) {
                    this.foraging();
                } else {
                    this.addLog('Здесь нельзя собирать травы', 'error');
                }
                break;
                
            case 'fish':
                if (currentLocation.actions.includes('fish')) {
                    this.fishing();
                } else {
                    this.addLog('Здесь нельзя рыбачить', 'error');
                }
                break;
                
            case 'rest':
                this.resting();
                break;
        }
        
        // Обновление времени
        this.advanceTime(30); // 30 минут игрового времени
    }
    
    mining() {
        const success = Math.random() > 0.3;
        
        if (success) {
            const ores = [
                { id: 'iron_ore', name: 'Железная руда', icon: '⛏️', xp: 10 },
                { id: 'copper_ore', name: 'Медная руда', icon: '🔶', xp: 15 },
                { id: 'coal', name: 'Уголь', icon: '⚫', xp: 5 }
            ];
            
            const ore = ores[Math.floor(Math.random() * ores.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            
            this.inventory.addItem(ore.id, quantity);
            this.player.addXP(ore.xp * quantity);
            
            this.addLog(`Вы добыли ${quantity}x ${ore.name} ${ore.icon} (+${ore.xp * quantity} опыта)`, 'loot');
        } else {
            this.addLog('Вы усердно копали, но ничего не нашли', 'info');
        }
        
        // Шанс встретить врага
        if (Math.random() > 0.7) {
            this.combat.startRandomEncounter();
        }
    }
    
    foraging() {
        const success = Math.random() > 0.4;
        
        if (success) {
            const herbs = [
                { id: 'healing_herb', name: 'Целебная трава', icon: '🌿', xp: 8 },
                { id: 'mana_herb', name: 'Магическая трава', icon: '🍃', xp: 12 },
                { id: 'poison_herb', name: 'Ядовитая трава', icon: '☠️', xp: 15 }
            ];
            
            const herb = herbs[Math.floor(Math.random() * herbs.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;
            
            this.inventory.addItem(herb.id, quantity);
            this.player.addXP(herb.xp * quantity);
            
            this.addLog(`Вы собрали ${quantity}x ${herb.name} ${herb.icon} (+${herb.xp * quantity} опыта)`, 'loot');
        } else {
            this.addLog('Вы искали травы, но ничего не нашли', 'info');
        }
    }
    
    fishing() {
        const success = Math.random() > 0.5;
        
        if (success) {
            const fish = [
                { id: 'small_fish', name: 'Маленькая рыба', icon: '🐟', xp: 5 },
                { id: 'medium_fish', name: 'Средняя рыба', icon: '🐠', xp: 10 },
                { id: 'big_fish', name: 'Большая рыба', icon: '🐡', xp: 20 }
            ];
            
            const fishType = fish[Math.floor(Math.random() * fish.length)];
            const quantity = 1;
            
            this.inventory.addItem(fishType.id, quantity);
            this.player.addXP(fishType.xp);
            
            this.addLog(`Вы поймали ${fishType.name} ${fishType.icon} (+${fishType.xp} опыта)`, 'loot');
        } else {
            this.addLog('Рыба сегодня не клюет', 'info');
        }
    }
    
    resting() {
        const healAmount = Math.floor(this.player.maxHealth * 0.3);
        const manaAmount = Math.floor(this.player.maxMana * 0.5);
        
        this.player.heal(healAmount);
        this.player.restoreMana(manaAmount);
        
        this.addLog(`Вы отдохнули. Восстановлено: ${healAmount} HP, ${manaAmount} MP`, 'info');
        this.updatePlayerInfo();
    }
    
    openCrafting() {
        const recipes = this.crafting.getAvailableRecipes();
        const craftRecipes = document.getElementById('craftRecipes');
        craftRecipes.innerHTML = '';
        
        recipes.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'recipe-item';
            recipeDiv.innerHTML = `
                <h4>${recipe.name}</h4>
                <p>${recipe.description}</p>
                <div class="recipe-ingredients">
                    ${recipe.ingredients.map(ing => 
                        `<span>${ing.name}: ${ing.quantity}</span>`
                    ).join(' ')}
                </div>
                <button onclick="gameEngine.craftItem('${recipe.id}')">Создать</button>
            `;
            craftRecipes.appendChild(recipeDiv);
        });
        
        this.openModal('craftModal');
    }
    
    craftItem(recipeId) {
        const result = this.crafting.craft(recipeId);
        
        if (result.success) {
            this.addLog(`Вы создали: ${result.item.name}`, 'loot');
            this.updateInventoryUI();
        } else {
            this.addLog(`Не удалось создать: ${result.message}`, 'error');
        }
        
        this.closeModal('craftModal');
    }
    
    travel(locationId) {
        const success = this.locations.travelTo(locationId);
        
        if (success) {
            this.addLog(`Вы отправились в: ${this.locations.getCurrentLocation().name}`, 'info');
            this.updateLocationInfo();
            
            // Проверка квестов на смену локации
            this.quests.checkLocationQuests(locationId);
        }
    }
    
    updatePlayerInfo() {
        document.getElementById('playerName').textContent = this.player.name;
        document.getElementById('playerLevel').textContent = this.player.level;
        document.getElementById('playerXP').textContent = `${this.player.xp}/${this.player.getNextLevelXP()}`;
        document.getElementById('playerGold').textContent = this.player.gold;
        
        // Здоровье и мана
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        const manaPercent = (this.player.mana / this.player.maxMana) * 100;
        
        document.getElementById('healthBar').style.width = `${healthPercent}%`;
        document.getElementById('manaBar').style.width = `${manaPercent}%`;
        document.getElementById('healthText').textContent = `${this.player.health}/${this.player.maxHealth}`;
        document.getElementById('manaText').textContent = `${this.player.mana}/${this.player.maxMana}`;
        
        // Характеристики
        document.getElementById('statStrength').textContent = this.player.stats.strength;
        document.getElementById('statDexterity').textContent = this.player.stats.dexterity;
        document.getElementById('statIntelligence').textContent = this.player.stats.intelligence;
        document.getElementById('statStamina').textContent = this.player.stats.stamina;
    }
    
    updateLocationInfo() {
        const location = this.locations.getCurrentLocation();
        document.getElementById('locationName').textContent = location.name;
        document.getElementById('locationDesc').textContent = location.description;
    }
    
    updateInventoryUI() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        inventoryGrid.innerHTML = '';
        
        this.inventory.items.forEach((item, index) => {
            if (item.quantity > 0) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                itemDiv.innerHTML = `
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-count">x${item.quantity}</div>
                `;
                itemDiv.addEventListener('click', () => this.useItem(item.id));
                inventoryGrid.appendChild(itemDiv);
            }
        });
        
        // Добавляем пустые слоты
        const emptySlots = 20 - this.inventory.items.filter(item => item.quantity > 0).length;
        for (let i = 0; i < emptySlots; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'inventory-item empty';
            emptyDiv.innerHTML = `<div class="item-icon">+</div><div class="item-name">Пусто</div>`;
            inventoryGrid.appendChild(emptyDiv);
        }
    }
    
    useItem(itemId) {
        const item = this.inventory.getItem(itemId);
        
        if (!item || item.quantity === 0) return;
        
        switch(item.type) {
            case 'potion':
                if (item.effect === 'heal') {
                    const healAmount = item.value;
                    this.player.heal(healAmount);
                    this.inventory.removeItem(itemId, 1);
                    this.addLog(`Вы использовали ${item.name}. Восстановлено ${healAmount} HP`, 'info');
                } else if (item.effect === 'mana') {
                    const manaAmount = item.value;
                    this.player.restoreMana(manaAmount);
                    this.inventory.removeItem(itemId, 1);
                    this.addLog(`Вы использовали ${item.name}. Восстановлено ${manaAmount} MP`, 'info');
                }
                break;
                
            case 'food':
                const healAmount = Math.floor(item.value);
                this.player.heal(healAmount);
                this.inventory.removeItem(itemId, 1);
                this.addLog(`Вы съели ${item.name}. Восстановлено ${healAmount} HP`, 'info');
                break;
        }
        
        this.updatePlayerInfo();
        this.updateInventoryUI();
    }
    
    updateQuestsUI() {
        const questsList = document.getElementById('questsList');
        questsList.innerHTML = '';
        
        this.quests.activeQuests.forEach(quest => {
            const questDiv = document.createElement('div');
            questDiv.className = 'quest-item';
            
            const progressPercent = (quest.progress / quest.requirement) * 100;
            
            questDiv.innerHTML = `
                <div class="quest-header">
                    <span class="quest-title">${quest.name}</span>
                    <span class="quest-status ${quest.status}">${quest.status === 'active' ? 'Активен' : 'Завершен'}</span>
                </div>
                <p class="quest-desc">${quest.description}</p>
                <div class="quest-progress">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                <div class="quest-reward">
                    Награда: ${quest.reward.gold} золота, ${quest.reward.xp} опыта
                    ${quest.reward.items ? `, ${quest.reward.items}` : ''}
                </div>
            `;
            
            questsList.appendChild(questDiv);
        });
    }
    
    updateShopUI() {
        const shopItems = document.getElementById('shopItems');
        shopItems.innerHTML = '';
        
        const category = this.shop.currentCategory;
        const items = this.shop.getItemsByCategory(category);
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <span class="item-icon">${item.icon}</span>
                    <span class="item-name">${item.name}</span>
                    <span class="item-desc">${item.description}</span>
                </div>
                <div class="shop-item-actions">
                    <span class="item-price">💰 ${item.price}</span>
                    <button class="buy-btn" onclick="gameEngine.buyItem('${item.id}')">Купить</button>
                </div>
            `;
            shopItems.appendChild(itemDiv);
        });
    }
    
    buyItem(itemId) {
        const result = this.shop.buyItem(itemId, this.player);
        
        if (result.success) {
            this.addLog(`Вы купили: ${result.item.name}`, 'loot');
            this.updatePlayerInfo();
            this.updateInventoryUI();
        } else {
            this.addLog(`Не удалось купить: ${result.message}`, 'error');
        }
    }
    
    updateNPCsUI() {
        const npcList = document.getElementById('npcList');
        npcList.innerHTML = '';
        
        this.npcs.npcs.forEach(npc => {
            const npcDiv = document.createElement('div');
            npcDiv.className = 'npc-card';
            npcDiv.innerHTML = `
                <div class="npc-avatar">${npc.icon}</div>
                <div class="npc-name">${npc.name}</div>
                <div class="npc-role">${npc.role}</div>
                <button class="interact-btn" onclick="gameEngine.interactWithNPC('${npc.id}')">
                    Поговорить
                </button>
            `;
            npcList.appendChild(npcDiv);
        });
    }
    
    interactWithNPC(npcId) {
        const npc = this.npcs.getNPC(npcId);
        const dialogue = this.npcs.getDialogue(npcId);
        
        this.addLog(`${npc.name}: ${dialogue}`, 'npc');
        
        // Проверка квестов NPC
        const quest = this.quests.getNPCQuest(npcId);
        if (quest && !quest.completed) {
            this.addLog(`${npc.name} предлагает квест: ${quest.name}`, 'quest');
            this.quests.acceptQuest(quest.id);
            this.updateQuestsUI();
        }
    }
    
    updateJobsUI() {
        const jobsList = document.getElementById('jobsList');
        jobsList.innerHTML = '';
        
        this.jobs.availableJobs.forEach(job => {
            const jobDiv = document.createElement('div');
            jobDiv.className = 'job-card';
            jobDiv.innerHTML = `
                <div class="job-title">${job.title}</div>
                <div class="job-desc">${job.description}</div>
                <div class="job-reward">Награда: ${job.reward} золота</div>
                <div class="job-time">Время: ${job.duration} минут</div>
                <button class="work-btn" onclick="gameEngine.startJob('${job.id}')">
                    Работать
                </button>
            `;
            jobsList.appendChild(jobDiv);
        });
    }
    
    startJob(jobId) {
        const job = this.jobs.getJob(jobId);
        
        if (this.jobs.startJob(jobId)) {
            this.addLog(`Вы начали работать: ${job.title}`, 'info');
            
            // Симуляция работы
            setTimeout(() => {
                const reward = this.jobs.completeJob(jobId);
                this.player.addGold(reward);
                this.player.addXP(reward / 2);
                
                this.addLog(`Вы завершили работу и получили ${reward} золота`, 'loot');
                this.updatePlayerInfo();
            }, job.duration * 1000); // 1 секунда = 1 минута игрового времени
        }
    }
    
    updateSkillsUI() {
        const skillsTree = document.getElementById('skillsTree');
        skillsTree.innerHTML = '';
        
        this.skills.skills.forEach(skill => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'skill-item';
            
            const canLearn = this.player.skillPoints > 0 && 
                           skill.requiredLevel <= this.player.level &&
                           !skill.learned;
            
            skillDiv.innerHTML = `
                <div class="skill-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level">Ур. ${skill.requiredLevel}</span>
                </div>
                <p class="skill-desc">${skill.description}</p>
                <div class="skill-effects">
                    Эффект: ${skill.effect}
                </div>
                ${canLearn ? 
                    `<button class="learn-btn" onclick="gameEngine.learnSkill('${skill.id}')">
                        Изучить (1 очко)
                    </button>` : 
                    `<span class="skill-status">${skill.learned ? 'Изучено' : 'Недоступно'}</span>`
                }
            `;
            
            skillsTree.appendChild(skillDiv);
        });
    }
    
    learnSkill(skillId) {
        if (this.player.skillPoints > 0) {
            const success = this.skills.learnSkill(skillId, this.player);
            
            if (success) {
                this.player.skillPoints--;
                this.addLog(`Вы изучили новый навык: ${this.skills.getSkill(skillId).name}`, 'info');
                this.updateSkillsUI();
                this.updatePlayerInfo();
            }
        }
    }
    
    updateUI() {
        this.updatePlayerInfo();
        
        // Обновление времени
        this.updateGameTime();
        
        // Проверка регенерации
        if (this.player.health < this.player.maxHealth) {
            this.player.health += this.player.stats.stamina * 0.01;
            if (this.player.health > this.player.maxHealth) {
                this.player.health = this.player.maxHealth;
            }
        }
        
        if (this.player.mana < this.player.maxMana) {
            this.player.mana += this.player.stats.intelligence * 0.02;
            if (this.player.mana > this.player.maxMana) {
                this.player.mana = this.player.maxMana;
            }
        }
    }
    
    updateGameTime() {
        this.gameTime.minute += 1;
        
        if (this.gameTime.minute >= 60) {
            this.gameTime.minute = 0;
            this.gameTime.hour += 1;
            
            if (this.gameTime.hour >= 24) {
                this.gameTime.hour = 0;
                this.gameTime.day += 1;
                
                // Ежедневные события
                this.dailyEvents();
            }
        }
        
        // Обновление отображения времени
        const timeString = `День ${this.gameTime.day}, ${this.gameTime.hour.toString().padStart(2, '0')}:${this.gameTime.minute.toString().padStart(2, '0')}`;
        // Можно добавить отображение времени в интерфейсе
    }
    
    dailyEvents() {
        this.addLog(`Наступил новый день (${this.gameTime.day})`, 'system');
        
        // Регенерация ресурсов в локациях
        this.locations.regenerateResources();
        
        // Обновление работ
        this.jobs.generateNewJobs();
        this.updateJobsUI();
        
        // Проверка квестов с временными ограничениями
        this.quests.checkTimedQuests();
    }
    
    advanceTime(minutes) {
        this.gameTime.minute += minutes;
        
        while (this.gameTime.minute >= 60) {
            this.gameTime.minute -= 60;
            this.gameTime.hour += 1;
            
            if (this.gameTime.hour >= 24) {
                this.gameTime.hour = 0;
                this.gameTime.day += 1;
                this.dailyEvents();
            }
        }
    }
    
    addLog(message, type = 'info') {
        const gameLog = document.getElementById('gameLog');
        const logEntry = document.createElement('div');
        
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[День ${this.gameTime.day}, ${this.gameTime.hour.toString().padStart(2, '0')}:${this.gameTime.minute.toString().padStart(2, '0')}]</span>
            <span class="log-text">${message}</span>
        `;
        
        gameLog.appendChild(logEntry);
        gameLog.scrollTop = gameLog.scrollHeight;
        
        // Ограничение количества записей
        const entries = gameLog.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }
    
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (this.isRunning) {
                // Основной игровой цикл
                this.updateUI();
                
                // Проверка квестов
                this.quests.checkQuestProgress();
                
                // Авто-атака если в бою
                if (this.combat.inCombat) {
                    this.combat.updateCombat();
                }
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    saveGame() {
        const saveData = {
            player: this.player.getSaveData(),
            inventory: this.inventory.getSaveData(),
            quests: this.quests.getSaveData(),
            locations: this.locations.getSaveData(),
            gameTime: this.gameTime,
            skills: this.skills.getSaveData()
        };
        
        localStorage.setItem('medievalRPG_save', JSON.stringify(saveData));
        console.log('Игра сохранена');
    }
    
    loadGame() {
        const saveData = localStorage.getItem('medievalRPG_save');
        
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                
                this.player.loadSaveData(data.player);
                this.inventory.loadSaveData(data.inventory);
                this.quests.loadSaveData(data.quests);
                this.locations.loadSaveData(data.locations);
                this.skills.loadSaveData(data.skills);
                this.gameTime = data.gameTime || this.gameTime;
                
                this.addLog('Игра загружена', 'system');
            } catch (error) {
                console.error('Ошибка загрузки игры:', error);
                this.addLog('Не удалось загрузить сохранение', 'error');
            }
        }
    }
    
    resetGame() {
        if (confirm('Вы уверены? Все прогресс будет потерян.')) {
            localStorage.removeItem('medievalRPG_save');
            location.reload();
        }
    }
}

// Player Class
class Player {
    constructor() {
        this.name = 'Сэр Артур';
        this.level = 1;
        this.xp = 0;
        this.gold = 50;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 50;
        this.maxMana = 50;
        this.skillPoints = 1;
        
        this.stats = {
            strength: 10,    // Сила - влияет на физический урон
            dexterity: 8,    // Ловкость - влияет на шанс попадания и уклонение
            intelligence: 6, // Интеллект - влияет на магический урон и ману
            stamina: 12      // Выносливость - влияет на здоровье и восстановление
        };
        
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        this.skills = [];
    }
    
    addXP(amount) {
        this.xp += amount;
        const nextLevelXP = this.getNextLevelXP();
        
        if (this.xp >= nextLevelXP) {
            this.levelUp();
        }
        
        return this.xp;
    }
    
    getNextLevelXP() {
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }
    
    levelUp() {
        this.level++;
        this.xp -= this.getNextLevelXP();
        
        // Увеличение характеристик
        this.maxHealth += 20 + this.stats.stamina;
        this.maxMana += 10 + this.stats.intelligence;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        
        // Очки навыков
        this.skillPoints += 1;
        
        // Увеличение базовых характеристик
        this.stats.strength += 1;
        this.stats.dexterity += 1;
        this.stats.intelligence += 1;
        this.stats.stamina += 1;
        
        // Показать окно повышения уровня
        gameEngine.openModal('levelUpModal');
        document.getElementById('newLevel').textContent = this.level;
        
        gameEngine.addLog(`🎉 Вы достигли уровня ${this.level}!`, 'system');
    }
    
    addGold(amount) {
        this.gold += amount;
        return this.gold;
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        return this.health;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
        return this.health;
    }
    
    restoreMana(amount) {
        this.mana += amount;
        if (this.mana > this.maxMana) {
            this.mana = this.maxMana;
        }
        return this.mana;
    }
    
    useMana(amount) {
        if (this.mana >= amount) {
            this.mana -= amount;
            return true;
        }
        return false;
    }
    
    getAttackDamage() {
        let damage = 5 + this.stats.strength;
        
        if (this.equipment.weapon) {
            damage += this.equipment.weapon.damage;
        }
        
        // Добавляем случайность
        damage += Math.floor(Math.random() * 5);
        
        return damage;
    }
    
    getDefense() {
        let defense = this.stats.dexterity;
        
        if (this.equipment.armor) {
            defense += this.equipment.armor.defense;
        }
        
        return defense;
    }
    
    getSaveData() {
        return {
            name: this.name,
            level: this.level,
            xp: this.xp,
            gold: this.gold,
            health: this.health,
            maxHealth: this.maxHealth,
            mana: this.mana,
            maxMana: this.maxMana,
            skillPoints: this.skillPoints,
            stats: this.stats,
            equipment: this.equipment,
            skills: this.skills
        };
    }
    
    loadSaveData(data) {
        Object.assign(this, data);
    }
}

// Location System
class LocationSystem {
    constructor() {
        this.locations = [];
        this.currentLocation = 'castle';
        
        this.locationsData = {
            castle: {
                id: 'castle',
                name: 'Королевский замок',
                description: 'Сердце королевства. Здесь начинается ваше приключение.',
                icon: '🏰',
                actions: ['rest', 'shop'],
                npcs: ['king', 'guard'],
                enemies: [],
                resources: []
            },
            forest: {
                id: 'forest',
                name: 'Темный лес',
                description: 'Густой лес, полный опасностей и тайн.',
                icon: '🌲',
                actions: ['forage', 'hunt'],
                npcs: ['hermit', 'hunter'],
                enemies: ['wolf', 'bear', 'bandit'],
                resources: ['wood', 'herbs', 'berries']
            },
            tavern: {
                id: 'tavern',
                name: 'Таверна "Пьяный гном"',
                description: 'Место, где можно отдохнуть и узнать новости.',
                icon: '🍺',
                actions: ['rest', 'drink', 'gamble'],
                npcs: ['barkeeper', 'merchant', 'adventurer'],
                enemies: [],
                resources: []
            },
            market: {
                id: 'market',
                name: 'Городской рынок',
                description: 'Шумный рынок, где можно купить всё необходимое.',
                icon: '🛒',
                actions: ['shop', 'trade'],
                npcs: ['blacksmith', 'alchemist', 'trader'],
                enemies: [],
                resources: []
            },
            dungeon: {
                id: 'dungeon',
                name: 'Забытое подземелье',
                description: 'Мрачное подземелье, полное монстров и сокровищ.',
                icon: '🏰',
                actions: ['explore', 'mine'],
                npcs: [],
                enemies: ['skeleton', 'spider', 'troll'],
                resources: ['ore', 'gems', 'artifacts']
            },
            mountain: {
                id: 'mountain',
                name: 'Ледяные горы',
                description: 'Высокие горы, где обитают древние существа.',
                icon: '⛰️',
                actions: ['mine', 'climb'],
                npcs: ['dwarf', 'shaman'],
                enemies: ['yeti', 'dragon', 'elemental'],
                resources: ['crystals', 'metal', 'relics']
            }
        };
    }
    
    loadLocations() {
        this.locations = Object.values(this.locationsData);
    }
    
    travelTo(locationId) {
        if (this.locationsData[locationId]) {
            this.currentLocation = locationId;
            return true;
        }
        return false;
    }
    
    getCurrentLocation() {
        return this.locationsData[this.currentLocation];
    }
    
    getLocation(locationId) {
        return this.locationsData[locationId];
    }
    
    regenerateResources() {
        // Регенерация ресурсов в локациях
        Object.values(this.locationsData).forEach(location => {
            if (location.resources.length > 0) {
                // Логика регенерации ресурсов
            }
        });
    }
    
    getSaveData() {
        return {
            currentLocation: this.currentLocation,
            locations: this.locations
        };
    }
    
    loadSaveData(data) {
        this.currentLocation = data.currentLocation;
        this.locations = data.locations;
    }
}

// Inventory System
class InventorySystem {
    constructor() {
        this.items = [];
        this.maxSlots = 20;
        
        this.itemDatabase = {
            // Зелья
            health_potion: {
                id: 'health_potion',
                name: 'Зелье здоровья',
                description: 'Восстанавливает 50 HP',
                icon: '❤️',
                type: 'potion',
                effect: 'heal',
                value: 50,
                price: 20,
                stackable: true,
                maxStack: 10
            },
            mana_potion: {
                id: 'mana_potion',
                name: 'Зелье маны',
                description: 'Восстанавливает 30 MP',
                icon: '🔮',
                type: 'potion',
                effect: 'mana',
