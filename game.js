// Game state
let currentLevel = 1;
let players = [0, 0, 0, 0];
let currentPlayer = 0;
let scores = [0, 0, 0, 0];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let finishedPlayers = [];

// DOM Elements
const board = document.getElementById('board');
const diceButton = document.getElementById('dice');
const nextLevelButton = document.getElementById('next-level');
const currentLevelDisplay = document.getElementById('current-level');
const currentPlayerDisplay = document.getElementById('current-player');
const leaderboardList = document.getElementById('leaderboard-list');
const modal = document.getElementById('question-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const optionsContainer = document.getElementById('options-container');
const closeModalBtn = document.getElementById('close-modal');

// Event Listeners
diceButton.addEventListener('click', rollDice);
nextLevelButton.addEventListener('click', goToNextLevel);
closeModalBtn.addEventListener('click', closeModal);

function updateLeaderboard() {
    leaderboardList.innerHTML = '';
    players.forEach((_, playerIndex) => {
        const listItem = document.createElement('li');
        listItem.className = 'text-gray-700';
        listItem.textContent = `Pemain ${playerIndex + 1}: ${scores[playerIndex]} poin`;
        leaderboardList.appendChild(listItem);
    });
}

function showModal(title, text, options = []) {
    modalTitle.textContent = title;
    modalText.innerHTML = text;
    optionsContainer.innerHTML = options
        .map(option => `
            <button class="quiz-option bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition w-full">
                ${option.text}
            </button>
        `)
        .join('');
    
    // Add event listeners to quiz options
    setTimeout(() => {
        document.querySelectorAll('.quiz-option').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                eval(options[index].action);
                closeModal();
            });
        });
    }, 0);
    
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    optionsContainer.innerHTML = '';
}

function checkTile(tileIndex, playerIndex) {
    const currentLevelData = levels[`level${currentLevel}`][tileIndex];
    
    if (!currentLevelData) return;
    
    switch (currentLevelData.type) {
        case 'quiz':
            showModal('Quiz Time!', currentLevelData.question, currentLevelData.options.map(option => ({
                text: option.text,
                action: `checkAnswer(${option.correct}, ${playerIndex})`
            })));
            break;
        case 'challenge':
            showModal('Challenge!', currentLevelData.task, [
                { text: 'Submit', action: `validateChallenge(${playerIndex})` }
            ]);
            break;
        case 'info':
            const infoContent = `
                <p>${currentLevelData.content}</p>
                ${currentLevelData.example ? `<p class="mt-2 text-sm text-gray-500">Contoh: ${currentLevelData.example}</p>` : ''}
            `;
            showModal('Info', infoContent, []);
            break;
        case 'reward':
            scores[playerIndex] += 10;
            updateLeaderboard();
            break;
        case 'finish':
            if (!finishedPlayers.includes(playerIndex)) {
                finishedPlayers.push(playerIndex);
                showFinishMessage(playerIndex);
                
                if (finishedPlayers.length >= 1) {
                    nextLevelButton.classList.remove('hidden');
                }
            }
            break;
    }
}

function checkAnswer(isCorrect, playerIndex) {
    if (isCorrect) {
        scores[playerIndex] += 10;
        updateLeaderboard();
    } else {
        alert('Jawaban salah! Coba lagi!');
    }
}

function validateChallenge(playerIndex) {
    // Simulate correct answer for now
    scores[playerIndex] += 20;
    leaderboard.push({ name: `Pemain ${playerIndex + 1}`, score: scores[playerIndex] });
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    updateLeaderboard();
}

function rollDice() {
    const steps = Math.floor(Math.random() * 3) + 1;
    movePlayer(currentPlayer, steps);
    
    const maxTileIndex = levels[`level${currentLevel}`].length - 1;
    if (players[currentPlayer] === maxTileIndex) {
        showFinishMessage(currentPlayer);
    }
    
    // Move to next player
    let nextPlayer = (currentPlayer + 1) % players.length;
    
    // Skip finished players
    while (finishedPlayers.includes(nextPlayer) && nextPlayer < players.length) {
        nextPlayer = (nextPlayer + 1) % players.length;
    }
    
    currentPlayer = nextPlayer;
    updateCurrentPlayer();
}

function movePlayer(playerIndex, steps) {
    players[playerIndex] += steps;
    const maxTileIndex = levels[`level${currentLevel}`].length - 1;
    
    if (players[playerIndex] > maxTileIndex) {
        players[playerIndex] = maxTileIndex;
    }
    
    updateBoard();
    checkTile(players[playerIndex], playerIndex);
}

function updateCurrentPlayer() {
    currentPlayerDisplay.textContent = `Giliran: Pemain ${currentPlayer + 1}`;
}

function updateBoard() {
    const currentLevelData = levels[`level${currentLevel}`];
    board.innerHTML = '';
    
    // Player colors
    const playerColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
    
    currentLevelData.forEach((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = `tile flex flex-col items-center justify-center text-center p-4 rounded-lg border-2 ${getTileColor(tile.type)}`;
        
        // Add tile icon and number
        tileElement.innerHTML = `
            <div class="text-3xl mb-2">${tile.icon || ''}</div>
            <div class="text-xs mt-auto">${index + 1}</div>
        `;
        
        // Add player indicators
        players.forEach((position, playerIndex) => {
            if (position === index) {
                const playerIndicator = document.createElement('div');
                playerIndicator.className = `player-indicator ${playerColors[playerIndex % playerColors.length]} text-white`;
                playerIndicator.textContent = playerIndex + 1;
                tileElement.appendChild(playerIndicator);
            }
        });
        
        board.appendChild(tileElement);
    });
}

function getTileColor(type) {
    const colors = {
        start: 'bg-green-200 border-green-500',
        info: 'bg-blue-200 border-blue-500',
        quiz: 'bg-yellow-200 border-yellow-500',
        challenge: 'bg-orange-200 border-orange-500',
        reward: 'bg-purple-200 border-purple-500',
        finish: 'bg-red-200 border-red-500'
    };
    return colors[type] || 'bg-gray-200 border-gray-400';
}

function showFinishMessage(playerIndex) {
    alert(`Pemain ${playerIndex + 1} menyelesaikan level ${currentLevel}!`);
}

function goToNextLevel() {
    if (currentLevel < 3) {
        currentLevel++;
        currentLevelDisplay.textContent = currentLevel;
        players = [0, 0, 0, 0];
        finishedPlayers = [];
        nextLevelButton.classList.add('hidden');
        currentPlayer = 0;
        updateCurrentPlayer();
        updateBoard();
    }
}

// Initialize game
updateBoard();
updateLeaderboard();
