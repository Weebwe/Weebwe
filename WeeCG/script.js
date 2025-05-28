// script.js

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const gameScreen = document.getElementById('game-screen');
    const walletScreen = document.getElementById('wallet-screen');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const tasksScreen = document.getElementById('tasks-screen');

    const progressBarFill = document.getElementById('progressBarFill');
    const loadingText = document.getElementById('loadingText');

    const clickButton = document.getElementById('clickButton');
    const scoreDisplay = document.getElementById('score');
    const mainBalanceDisplay = document.getElementById('mainBalance'); // Для WEE Balance
    const energyBarFill = document.getElementById('energyBarFill');
    const energyText = document.getElementById('energyText');

    const upgrade1Button = document.getElementById('upgrade1');
    const upgrade1CostDisplay = document.getElementById('upgrade1Cost');
    const upgrade2Button = document.getElementById('upgrade2');
    const upgrade2CostDisplay = document.getElementById('upgrade2Cost');

    // Wallet elements
    const weeBalanceDisplay = document.getElementById('weeBalance');
    const walletCoinBalanceDisplay = document.getElementById('walletCoinBalance');
    const exchangeAmountInput = document.getElementById('exchangeAmount');
    const exchangeButton = document.getElementById('exchangeButton');

    // Leaderboard elements
    const leaderboardList = document.getElementById('leaderboardList');
    const refreshLeaderboardButton = document.getElementById('refreshLeaderboard');

    // Tasks elements
    const tasksList = document.getElementById('tasksList');

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item');

    let currentScore = 0;
    let clickPower = 1;
    let autoClickRate = 0; // coins per second
    let upgrade1Cost = 100;
    let upgrade2Cost = 500;

    // Збільшений ліміт енергії: 1000
    const MAX_ENERGY = 1000;
    let currentEnergy = MAX_ENERGY; // Починаємо з повної енергії
    const ENERGY_REGEN_RATE = 10; // Energy points per second
    let lastEnergyRegenTime = Date.now();

    // Exchange rate for WEE Coin
    const WEE_EXCHANGE_RATE = 1000000; // 1,000,000 coins = 1 WEE
    let weeBalance = 0.00; // This should come from backend

    // --- Loading Screen Logic ---
    let progress = 0;
    const loadInterval = setInterval(() => {
        progress += 10;
        progressBarFill.style.width = `${progress}%`;
        loadingText.textContent = `Завантаження... ${progress}%`;

        if (progress >= 100) {
            clearInterval(loadInterval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                gameScreen.classList.remove('hidden');
                // Initial update of UI after loading
                updateUI();
                startAutoClicker();
                startEnergyRegen();
                // Show game screen and hide loading screen
                // The main-content-wrapper will correctly place the game screen above the nav
            }, 500); // Small delay to show 100%
        }
    }, 100);

    // --- Telegram Web App Init (if needed) ---
    // if (window.Telegram && window.Telegram.WebApp) {
    //     Telegram.WebApp.ready();
    //     const userId = Telegram.WebApp.initDataUnsafe?.user?.id;
    //     if (userId) {
    //         document.getElementById('debugUserId').textContent = `User ID: ${userId}`;
    //     }
    //     // Example of using Telegram's MainButton
    //     // Telegram.WebApp.MainButton.setText("Клікни мене!");
    //     // Telegram.WebApp.MainButton.show();
    //     // Telegram.WebApp.MainButton.onClick(() => {
    //     //     // Handle main button click
    //     // });
    // }

    // --- Game Logic ---
    function updateUI() {
        scoreDisplay.textContent = currentScore;
        energyText.textContent = `${currentEnergy}/${MAX_ENERGY}`;
        energyBarFill.style.width = `${(currentEnergy / MAX_ENERGY) * 100}%`;

        upgrade1CostDisplay.textContent = upgrade1Cost;
        upgrade2CostDisplay.textContent = upgrade2Cost;

        upgrade1Button.disabled = currentScore < upgrade1Cost;
        upgrade2Button.disabled = currentScore < upgrade2Cost;

        // Update balances on Wallet screen
        weeBalanceDisplay.textContent = weeBalance.toFixed(2);
        walletCoinBalanceDisplay.textContent = currentScore; // Coins are the same as game score
        mainBalanceDisplay.textContent = weeBalance.toFixed(2); // Assuming mainBalance displays WEE
    }

    function showFloatingText(x, y, text) {
        const floatingText = document.createElement('div');
        floatingText.classList.add('floating-text');
        floatingText.textContent = text;
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        document.body.appendChild(floatingText);

        floatingText.addEventListener('animationend', () => {
            floatingText.remove();
        });
    }

    clickButton.addEventListener('click', (event) => {
        if (currentEnergy >= 1) {
            currentScore += clickPower;
            currentEnergy = Math.max(0, currentEnergy - 1); // Decrease energy by 1
            updateUI();
            showFloatingText(event.clientX, event.clientY, `+${clickPower}`);
        } else {
            // Optionally, provide feedback that energy is too low
            console.log("Недостатньо енергії!");
        }
    });

    upgrade1Button.addEventListener('click', () => {
        if (currentScore >= upgrade1Cost) {
            currentScore -= upgrade1Cost;
            clickPower += 1;
            upgrade1Cost = Math.floor(upgrade1Cost * 1.5); // Increase cost
            updateUI();
        }
    });

    upgrade2Button.addEventListener('click', () => {
        if (currentScore >= upgrade2Cost) {
            currentScore -= upgrade2Cost;
            autoClickRate += 1;
            upgrade2Cost = Math.floor(upgrade2Cost * 2); // Increase cost
            updateUI();
            startAutoClicker(); // Ensure auto-clicker is running
        }
    });

    function startAutoClicker() {
        if (autoClickRate > 0 && !window.autoClickInterval) {
            window.autoClickInterval = setInterval(() => {
                currentScore += autoClickRate;
                updateUI();
                // No floating text for auto-clicks to avoid clutter
            }, 1000); // Every second
        } else if (autoClickRate === 0 && window.autoClickInterval) {
            clearInterval(window.autoClickInterval);
            window.autoClickInterval = null;
        }
    }

    function startEnergyRegen() {
        setInterval(() => {
            const now = Date.now();
            const elapsedTime = (now - lastEnergyRegenTime) / 1000; // in seconds
            lastEnergyRegenTime = now;

            const energyToRegen = Math.floor(elapsedTime * ENERGY_REGEN_RATE);
            if (energyToRegen > 0) {
                currentEnergy = Math.min(MAX_ENERGY, currentEnergy + energyToRegen);
                updateUI();
            }
        }, 1000); // Check every second
    }

    // --- Wallet Screen Logic ---
    exchangeButton.addEventListener('click', () => {
        const amountToExchange = parseInt(exchangeAmountInput.value);

        if (isNaN(amountToExchange) || amountToExchange < WEE_EXCHANGE_RATE) {
            alert(`Будь ласка, введіть суму, більшу або рівну ${WEE_EXCHANGE_RATE} монет.`);
            return;
        }

        if (currentScore >= amountToExchange) {
            const weeEarned = amountToExchange / WEE_EXCHANGE_RATE;
            currentScore -= amountToExchange;
            weeBalance += weeEarned; // Update local balance

            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // TODO: Надсилати запит на бекенд для обміну монет на WEE.
            // Приклад (псевдокод):
            // fetch('/api/exchange', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ userId: Telegram.WebApp.initDataUnsafe?.user?.id, coins: amountToExchange })
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.success) {
            //         weeBalance = data.newWeeBalance; // Оновлюємо баланс з бекенду
            //         alert(`Успішно обміняно ${amountToExchange} монет на ${weeEarned.toFixed(2)} WEE!`);
            //     } else {
            //         alert('Помилка обміну: ' + data.message);
            //         currentScore += amountToExchange; // Повертаємо монети, якщо обмін не вдався
            //     }
            // })
            // .catch(error => {
            //     console.error('Помилка запиту:', error);
            //     alert('Помилка зв\'язку з сервером. Спробуйте пізніше.');
            //     currentScore += amountToExchange; // Повертаємо монети
            // });
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

            alert(`Успішно обміняно ${amountToExchange} монет на ${weeEarned.toFixed(2)} WEE!`);
            exchangeAmountInput.value = ''; // Clear input
            updateUI();
        } else {
            alert('Недостатньо монет для обміну!');
        }
    });

    // --- Leaderboard Screen Logic ---
    refreshLeaderboardButton.addEventListener('click', () => {
        fetchLeaderboardData();
    });

    async function fetchLeaderboardData() {
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // TODO: Надсилати запит на бекенд для отримання даних лідерборду.
        // Приклад (псевдокод):
        // try {
        //     const response = await fetch('/api/leaderboard');
        //     const data = await response.json();
        //     if (data.success) {
        //         displayLeaderboard(data.leaders);
        //     } else {
        //         console.error('Failed to load leaderboard:', data.message);
        //         leaderboardList.innerHTML = '<li style="text-align:center;">Помилка завантаження лідерборду.</li>';
        //     }
        // } catch (error) {
        //     console.error('Error fetching leaderboard:', error);
        //     leaderboardList.innerHTML = '<li style="text-align:center;">Не вдалося з\'єднатися з сервером.</li>';
        // }
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Mock data for demonstration without backend
        const mockLeaders = [
            { rank: 1, name: "Гравець A", score: 5000000 },
            { rank: 2, name: "Гравець B", score: 4500000 },
            { rank: 3, name: "Гравець C", score: 4000000 },
            { rank: 4, name: "Гравець D", score: 3500000 },
            { rank: 5, name: "Гравець E", score: 3000000 },
        ];
        displayLeaderboard(mockLeaders);
    }

    function displayLeaderboard(leaders) {
        leaderboardList.innerHTML = '';
        if (leaders.length === 0) {
            leaderboardList.innerHTML = '<li style="text-align:center;">Лідерборд порожній.</li>';
            return;
        }
        leaders.forEach(leader => {
            const li = document.createElement('li');
            li.classList.add('leaderboard-item');
            li.innerHTML = `
                <span class="rank">${leader.rank}.</span>
                <span class="name">${leader.name}</span>
                <span class="score">${leader.score.toLocaleString()} 🪙</span>
            `;
            leaderboardList.appendChild(li);
        });
    }

    // --- Tasks Screen Logic ---
    async function fetchTasksData() {
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // TODO: Надсилати запит на бекенд для отримання списку завдань та їхнього статусу.
        // Приклад (псевдокод):
        // try {
        //     const response = await fetch('/api/tasks');
        //     const data = await response.json();
        //     if (data.success) {
        //         displayTasks(data.tasks);
        //     } else {
        //         console.error('Failed to load tasks:', data.message);
        //         tasksList.innerHTML = '<li style="text-align:center;">Помилка завантаження завдань.</li>';
        //     }
        // } catch (error) {
        //     console.error('Error fetching tasks:', error);
        //     tasksList.innerHTML = '<li style="text-align:center;">Не вдалося з\'єднатися з сервером.</li>';
        // }
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Mock data for demonstration without backend
        const mockTasks = [
            { id: 1, name: "Привітання", description: "Підпишіться на наш Telegram-канал.", reward: "500 🪙", type: "coins", completed: false },
            { id: 2, name: "Перша покупка", description: "Купіть будь-яке покращення.", reward: "0.5 WEE", type: "wee", completed: false },
            { id: 3, name: "Запроси друга", description: "Запросіть одного друга в гру.", reward: "1.0 WEE", type: "wee", completed: true }, // Example of completed task
            { id: 4, name: "Натисни 1000 разів", description: "Клікніть монету 1000 разів.", reward: "1000 🪙", type: "coins", completed: false },
        ];
        displayTasks(mockTasks);
    }

    function displayTasks(tasks) {
        tasksList.innerHTML = '';
        if (tasks.length === 0) {
            tasksList.innerHTML = '<li style="text-align:center;">Наразі немає доступних завдань.</li>';
            return;
        }
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.classList.add('task-item');
            li.innerHTML = `
                <h3>${task.name}</h3>
                <p>${task.description}</p>
                <span class="reward">Нагорода: ${task.reward}</span>
                <button data-task-id="${task.id}" ${task.completed ? 'disabled' : ''}>
                    ${task.completed ? 'Виконано' : 'Виконати'}
                </button>
            `;
            tasksList.appendChild(li);

            const taskButton = li.querySelector('button');
            if (!task.completed) {
                taskButton.addEventListener('click', () => completeTask(task.id, task.type, task.reward));
            }
        });
    }

    function completeTask(taskId, taskType, reward) {
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // TODO: Надсилати запит на бекенд для позначення завдання як виконаного та видачі нагороди.
        // Приклад (псевдокод):
        // fetch('/api/completeTask', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ userId: Telegram.WebApp.initDataUnsafe?.user?.id, taskId: taskId })
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.success) {
        //         alert(`Завдання "${taskId}" виконано! Отримано: ${reward}`);
        //         if (taskType === 'coins') {
        //             currentScore += parseInt(reward.replace(' 🪙', ''));
        //         } else if (taskType === 'wee') {
        //             weeBalance += parseFloat(reward.replace(' WEE', ''));
        //         }
        //         updateUI();
        //         fetchTasksData(); // Refresh tasks list
        //     } else {
        //         alert('Помилка виконання завдання: ' + data.message);
        //     }
        // })
        // .catch(error => {
        //     console.error('Помилка запиту:', error);
        //     alert('Помилка зв\'язку з сервером. Спробуйте пізніше.');
        // });
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Mock completion for demonstration
        alert(`Завдання "${taskId}" виконано! (Це імітація)`);
        // In a real app, after successful backend response:
        // currentScore or weeBalance would be updated and tasks refetched/updated
        // For now, just show it as completed and update UI
        if (taskType === 'coins') {
            currentScore += parseInt(reward.replace(' 🪙', ''));
        } else if (taskType === 'wee') {
            weeBalance += parseFloat(reward.replace(' WEE', ''));
        }
        updateUI();
        // Re-fetch tasks to update UI for completed task (button disabled)
        fetchTasksData();
    }


    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreen = item.dataset.screen;

            // Hide all screens
            gameScreen.classList.add('hidden');
            walletScreen.classList.add('hidden');
            leaderboardScreen.classList.add('hidden');
            tasksScreen.classList.add('hidden');

            // Show target screen
            if (targetScreen === 'game') {
                gameScreen.classList.remove('hidden');
            } else if (targetScreen === 'wallet') {
                walletScreen.classList.remove('hidden');
                updateUI(); // Ensure wallet balance is up-to-date
            } else if (targetScreen === 'leaderboard') {
                leaderboardScreen.classList.remove('hidden');
                fetchLeaderboardData(); // Load data when screen is opened
            } else if (targetScreen === 'tasks') {
                tasksScreen.classList.remove('hidden');
                fetchTasksData(); // Load data when screen is opened
            }

            // Update active state in navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Initial UI update and start auto-clicker/energy regen after loading screen
    // These are called from the loading screen logic
});
