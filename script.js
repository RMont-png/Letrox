// Estado do Jogo
const gameState = {
    level: 1,
    score: 0,
    wordsDict: {}, // Dicionário completo agrupado por tamanho
    currentMasterWord: "",
    validWordsForLevel: [], // Array de objetos {word: "...", length: 3, found: false}
    deckLetters: [],
    inputLetters: [],
    masterWordFound: false,
    revealed: false
};

// Elementos da UI
const ui = {
    menuScreen: document.getElementById('menu-screen'),
    gameScreen: document.getElementById('game-screen'),
    playBtn: document.getElementById('play-btn'),
    rulesBtn: document.getElementById('rules-btn'),
    backBtn: document.getElementById('back-btn'),
    recordLevel: document.getElementById('record-level'),
    recordScore: document.getElementById('record-score'),
    levelDisplay: document.getElementById('level-display'),
    scoreDisplay: document.getElementById('score-display'),
    nextLevelBtn: document.getElementById('next-level-btn'),
    wordsBoard: document.getElementById('words-board'),
    inputArea: document.getElementById('input-area'),
    deckArea: document.getElementById('deck-area'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    submitBtn: document.getElementById('submit-btn'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalText: document.getElementById('modal-text'),
    modalBtn: document.getElementById('modal-btn')
};

// Inicialização
async function initGame() {
    try {
        // Carrega o JSON com o dicionário gerado pelo usuário
        const response = await fetch("./palavras_letrox.json");
        if (!response.ok) throw new Error("Erro ao carregar dicionário");
        gameState.wordsDict = await response.json();

        updateMenuRecords();
    } catch (error) {
        console.error("Erro inicial:", error);
        showModal("Aviso", "Para jogar com o dicionário JSON local, você precisa abrir o index.html usando um servidor local (Live Server no VSCode).", "Tentar Novamente", initGame);
    }
}

function updateMenuRecords() {
    const recLevel = localStorage.getItem('letrox_max_level') || 1;
    const recScore = localStorage.getItem('letrox_max_score') || 0;
    ui.recordLevel.textContent = recLevel;
    ui.recordScore.textContent = recScore;
}

function saveRecords() {
    const currentMaxLevel = parseInt(localStorage.getItem('letrox_max_level') || 1);
    const currentMaxScore = parseInt(localStorage.getItem('letrox_max_score') || 0);

    if (gameState.level > currentMaxLevel) {
        localStorage.setItem('letrox_max_level', gameState.level);
    }
    if (gameState.score > currentMaxScore) {
        localStorage.setItem('letrox_max_score', gameState.score);
    }
}

function startGame() {
    gameState.level = 1;
    gameState.score = 0;
    ui.menuScreen.classList.add('hidden');
    ui.gameScreen.classList.remove('hidden');
    ui.backBtn.textContent = "⬅ Voltar";
    ui.scoreDisplay.textContent = "0";
    loadLevel();
}

function showRules() {
    showModal(
        "Como Jogar",
        "Forme palavras usando as letras fornecidas. O jogo avança quando você encontra a Palavra Mestre (que usa todas as letras da rodada).",
        "Entendi",
        closeModal
    );
}

function backToMenu() {
    // Mesma lógica de revelar palavras se houver alguma
    const missedWords = gameState.validWordsForLevel.filter(w => !w.found);

    if (missedWords.length > 0 && !gameState.revealed) {
        gameState.revealed = true;
        missedWords.forEach(w => w.revealed = true);
        renderBoard();
        ui.backBtn.textContent = "Sair →";
        return;
    }

    // Volta pro menu
    saveRecords();
    updateMenuRecords();
    ui.gameScreen.classList.add('hidden');
    ui.menuScreen.classList.remove('hidden');
    ui.backBtn.textContent = "⬅ Voltar";
}

// Lógica de Geração de Nível
function loadLevel() {
    // Sorteia um tamanho aleatório entre 5 e 8 letras para a palavra mestre, independente do nível
    let targetLength = Math.floor(Math.random() * 4) + 5;

    // Escolhe uma palavra mestre aleatória desse tamanho
    const masterWords = gameState.wordsDict[targetLength.toString()];
    if (!masterWords || masterWords.length === 0) {
        showModal("Fim de Jogo", "Você zerou nosso banco de palavras!", "Início", () => {
            gameState.level = 1;
            gameState.score = 0;
            loadLevel();
        });
        return;
    }

    // Para evitar palavras que geram poucos anagramas, num jogo real filtraríamos por palavras com mínimo de anagramas
    gameState.currentMasterWord = masterWords[Math.floor(Math.random() * masterWords.length)].toUpperCase();
    gameState.masterWordFound = false;
    gameState.revealed = false;

    if (targetLength >= 7) {
        ui.deckArea.classList.add('compact');
        ui.inputArea.classList.add('compact');
    } else {
        ui.deckArea.classList.remove('compact');
        ui.inputArea.classList.remove('compact');
    }

    // Encontra todos os anagramas possíveis
    gameState.validWordsForLevel = findValidAnagrams(gameState.currentMasterWord);

    // Se a palavra gerar menos de 3 anagramas além dela mesma, tenta outra (se possível)
    if (gameState.validWordsForLevel.length < 4) {
        return loadLevel(); // re-roll
    }

    // Prepara as letras do deck (removemos acentos para o deck ser limpo)
    const unaccentedMaster = removeAccents(gameState.currentMasterWord);
    gameState.deckLetters = unaccentedMaster.split('');
    shuffleArray(gameState.deckLetters);
    gameState.inputLetters = [];

    // Atualiza a UI
    ui.levelDisplay.textContent = gameState.level;
    ui.nextLevelBtn.classList.add('hidden');
    renderBoard();
    renderInput();
    renderDeck();
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getCharCount(word) {
    const counts = {};
    for (let char of word) {
        counts[char] = (counts[char] || 0) + 1;
    }
    return counts;
}

function findValidAnagrams(masterWord) {
    const unaccentedMaster = removeAccents(masterWord);
    const masterCounts = getCharCount(unaccentedMaster);
    const validWords = [];

    // Percorre todos os tamanhos de 3 até o tamanho da masterWord
    for (let len = 3; len <= masterWord.length; len++) {
        const wordsOfLength = gameState.wordsDict[len.toString()];
        if (!wordsOfLength) continue;

        for (let word of wordsOfLength) {
            let upperWord = word.toUpperCase();
            let unaccentedWord = removeAccents(upperWord);

            if (canFormWord(unaccentedWord, masterCounts)) {
                validWords.push({
                    word: upperWord,
                    unaccentedWord: unaccentedWord,
                    length: upperWord.length,
                    found: false,
                    isMaster: upperWord.length === masterWord.length
                });
            }
        }
    }

    // Ordena as palavras primeiro por tamanho, e depois alfabeticamente
    return validWords.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.word.localeCompare(b.word);
    });
}

function canFormWord(word, masterCounts) {
    const wordCounts = getCharCount(word);
    for (let char in wordCounts) {
        if (!masterCounts[char] || wordCounts[char] > masterCounts[char]) {
            return false;
        }
    }
    return true;
}

// Renderização
function renderBoard() {
    ui.wordsBoard.innerHTML = '';

    // Configura o tamanho dinâmico dos slots e quantidade de colunas
    const totalWords = gameState.validWordsForLevel.length;
    let slotSize;

    if (totalWords <= 8) slotSize = 36;
    else if (totalWords <= 12) slotSize = 32;
    else if (totalWords <= 18) slotSize = 28;
    else if (totalWords <= 24) slotSize = 24;
    else if (totalWords <= 30) slotSize = 22;
    else if (totalWords <= 40) slotSize = 18;
    else if (totalWords <= 55) slotSize = 14;
    else slotSize = 11;

    document.documentElement.style.setProperty('--slot-size', `${slotSize}px`);
    document.documentElement.style.setProperty('--slot-font', `${slotSize * 0.65}px`);

    // Calcula espaço vertical baseado na tela real do dispositivo (para evitar falha quando div está oculta)
    let boardHeight = window.innerHeight - 320; 
    if (boardHeight < 200) boardHeight = 200;

    const itemHeight = slotSize + 4; // tamanho + gap da coluna
    const maxItemsPerColumn = Math.max(1, Math.floor((boardHeight - 10) / itemHeight));

    const numCols = Math.ceil(totalWords / maxItemsPerColumn);
    const wordsPerCol = Math.ceil(totalWords / numCols);
    let currentColDiv;

    // gameState.validWordsForLevel já está ordenado por tamanho
    gameState.validWordsForLevel.forEach((item, index) => {
        // Cria nova coluna a cada limite (wordsPerCol) ou no primeiro item
        if (index % wordsPerCol === 0) {
            currentColDiv = document.createElement('div');
            currentColDiv.className = 'board-column';
            ui.wordsBoard.appendChild(currentColDiv);
        }

        const rowDiv = document.createElement('div');
        rowDiv.className = 'word-row';

        for (let i = 0; i < item.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'letter-slot';
            if (item.found || item.revealed) {
                slot.textContent = item.word[i];
                if (item.found) {
                    slot.classList.add('filled');
                    if (item.isMaster) slot.classList.add('master');
                } else if (item.revealed) {
                    slot.classList.add('revealed');
                }
            }
            rowDiv.appendChild(slot);
        }
        currentColDiv.appendChild(rowDiv);
    });
}

function renderInput() {
    ui.inputArea.innerHTML = '';
    gameState.inputLetters.forEach((letterObj, index) => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'input-letter';
        letterDiv.textContent = letterObj.char;
        letterDiv.onclick = () => moveFromInputToDeck(index);
        ui.inputArea.appendChild(letterDiv);
    });
}

function renderDeck() {
    ui.deckArea.innerHTML = '';
    gameState.deckLetters.forEach((char, index) => {
        const isUsed = gameState.inputLetters.some(item => item.deckIndex === index);
        const letterDiv = document.createElement('div');
        letterDiv.className = 'deck-letter';
        if (isUsed) letterDiv.classList.add('used');
        letterDiv.textContent = char;
        letterDiv.onclick = () => {
            if (!isUsed) moveFromDeckToInput(index, char);
        };
        ui.deckArea.appendChild(letterDiv);
    });
}

// Interações
function moveFromDeckToInput(deckIndex, char) {
    gameState.inputLetters.push({ char, deckIndex });
    renderInput();
    renderDeck();
}

function moveFromInputToDeck(inputIndex) {
    gameState.inputLetters.splice(inputIndex, 1);
    renderInput();
    renderDeck();
}

function shuffleDeck() {
    // Para embaralhar corretamente sem perder a referência do que já foi usado,
    // a forma mais intuitiva para o jogador é devolver as letras e embaralhar tudo.
    while (gameState.inputLetters.length > 0) {
        gameState.inputLetters.pop();
    }
    shuffleArray(gameState.deckLetters);
    renderInput();
    renderDeck();
}

function submitWord() {
    if (gameState.revealed) return;
    if (gameState.inputLetters.length < 3) return;

    const formedWord = gameState.inputLetters.map(item => item.char).join('');

    const wordObj = gameState.validWordsForLevel.find(w => w.unaccentedWord === formedWord);

    if (wordObj) {
        if (wordObj.found) {
            // Já encontrada
            showFeedback(ui.inputArea, 'shake');
        } else {
            // Acertou
            wordObj.found = true;
            addScore(wordObj.length);
            showFeedback(ui.inputArea, 'success-bg');
            renderBoard();

            // Regra de Ouro (A palavra mestre libera o avanço)
            if (wordObj.isMaster && !gameState.masterWordFound) {
                gameState.masterWordFound = true;
                ui.nextLevelBtn.classList.remove('hidden');

                setTimeout(() => {
                    showModal("Palavra Mestre Encontrada!", "Muito bem! Você encontrou a palavra que usa todas as letras. Você pode avançar para o próximo nível agora ou continuar tentando encontrar as palavras menores para ganhar mais pontos.", "Continuar Jogando", closeModal);
                }, 600);
            }

            // Verifica se achou TODAS
            if (gameState.validWordsForLevel.every(w => w.found)) {
                setTimeout(() => {
                    showModal("Nível Concluído!", "Você encontrou TODAS as palavras ocultas deste nível! Você é um mestre.", "Próximo Nível", nextLevel);
                }, 600);
            }
        }
    } else {
        // Palavra inválida
        showFeedback(ui.inputArea, 'error-bg');
        showFeedback(ui.inputArea, 'shake');
    }

    // Limpa o input com um delay se errou, ou imediatamente se acertou
    setTimeout(() => {
        gameState.inputLetters = [];
        renderInput();
        renderDeck();
    }, wordObj ? 300 : 500);
}

function showFeedback(element, className) {
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, 400);
}

function addScore(wordLength) {
    // 3 letras = +10, 4 letras = +20, etc... + Bônus para mestre
    let points = (wordLength - 2) * 10;
    if (wordLength === gameState.currentMasterWord.length) {
        points += 50;
    }
    gameState.score += points;
    ui.scoreDisplay.textContent = gameState.score;
}

function nextLevel() {
    closeModal();

    // Verifica se há palavras não encontradas
    const missedWords = gameState.validWordsForLevel.filter(w => !w.found);

    // Se há palavras faltando e ainda não foram reveladas, revela e pausa o avanço
    if (missedWords.length > 0 && !gameState.revealed) {
        gameState.revealed = true;
        missedWords.forEach(w => w.revealed = true);
        renderBoard();
        ui.nextLevelBtn.textContent = "Avançar →";
        return;
    }

    // Avança de fato
    ui.nextLevelBtn.textContent = "Próximo Nível";
    saveRecords();
    gameState.level++;
    loadLevel();
}

// Modais
function showModal(title, text, btnText, callback) {
    ui.modalTitle.textContent = title;
    ui.modalText.textContent = text;
    ui.modalBtn.textContent = btnText;
    ui.modalBtn.onclick = callback;
    ui.modal.classList.remove('hidden');
}

function closeModal() {
    ui.modal.classList.add('hidden');
}

// Utils
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Event Listeners
ui.shuffleBtn.addEventListener('click', shuffleDeck);
ui.submitBtn.addEventListener('click', submitWord);
ui.nextLevelBtn.addEventListener('click', nextLevel);
ui.playBtn.addEventListener('click', startGame);
ui.rulesBtn.addEventListener('click', showRules);
ui.backBtn.addEventListener('click', backToMenu);

// Inicializa
initGame();
