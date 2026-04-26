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

    // Mede a altura REAL e exata do container para calcular os limites da coluna
    let boardHeight = ui.wordsBoard.parentElement.clientHeight;
    if (!boardHeight || boardHeight < 100) {
        boardHeight = 400; // fallback de segurança
    }

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
        rowDiv.dataset.word = item.word;

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

function renderInput(hiddenIndex = -1) {
    ui.inputArea.innerHTML = '';
    const wordLen = gameState.deckLetters.length;

    for (let i = 0; i < wordLen; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'sphere-wrapper';
        wrapper.dataset.inputSlot = i;

        const letterObj = gameState.inputLetters[i] || null;
        if (letterObj) {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'input-letter';
            letterDiv.textContent = letterObj.char;
            letterDiv.dataset.deckIndex = letterObj.deckIndex;
            
            // Criado já invisível para evitar flash durante animação
            if (i === hiddenIndex) {
                letterDiv.style.opacity = '0';
                letterDiv.style.transition = 'none';
            }

            // Encontra o índice real no array para clicar corretamente
            letterDiv.onclick = () => moveFromInputToDeck(i);
            wrapper.appendChild(letterDiv);
        }
        ui.inputArea.appendChild(wrapper);
    }
}

function renderDeck(hiddenIndices = [], hideAll = false) {
    if (!Array.isArray(hiddenIndices)) {
        hiddenIndices = hiddenIndices === -1 ? [] : [hiddenIndices];
    }
    ui.deckArea.innerHTML = '';
    gameState.deckLetters.forEach((char, index) => {
        const isUsed = gameState.inputLetters.some(item => item.deckIndex === index);

        const wrapper = document.createElement('div');
        wrapper.className = 'sphere-wrapper';
        wrapper.dataset.deckIndex = index;

        const letterDiv = document.createElement('div');
        letterDiv.className = 'deck-letter';
        letterDiv.dataset.deckIndex = index;
        if (isUsed) letterDiv.classList.add('used');
        // Criado já invisível para evitar flash durante animação
        if (hiddenIndices.includes(index) || hideAll) {
            letterDiv.style.opacity = '0';
            letterDiv.style.transition = 'none';
        }
        letterDiv.textContent = char;
        letterDiv.onclick = () => {
            if (!isUsed) moveFromDeckToInput(index, char);
        };
        wrapper.appendChild(letterDiv);
        ui.deckArea.appendChild(wrapper);
    });
}

// ── Animações ──────────────────────────────────────────────────────────────

/**
 * FLIP Helper: anima um elemento clonado viajando de startRect até destRect.
 * @param {string} char - Letra a exibir no ghost
 * @param {DOMRect} startRect
 * @param {DOMRect} destRect
 * @param {Object} options - { duration, arcY, onDone }
 */
function animateFLIPGhost(char, startRect, destRect, options = {}) {
    const { duration = 260, arcY = 0, onDone } = options;

    const ghost = document.createElement('div');
    ghost.className = 'deck-letter';
    ghost.textContent = char;
    ghost.style.cssText = `
        position: fixed;
        left: ${startRect.left}px;
        top: ${startRect.top}px;
        width: ${startRect.width}px;
        height: ${startRect.height}px;
        margin: 0;
        z-index: 9999;
        pointer-events: none;
        transition: none;
    `;
    document.body.appendChild(ghost);

    const dx     = destRect.left - startRect.left;
    const dy     = destRect.top  - startRect.top;
    const scaleX = destRect.width  / startRect.width;
    const scaleY = destRect.height / startRect.height;

    const keyframes = arcY !== 0
        ? [
            { transform: `translate(0,0) scale(1)`, opacity: 1, offset: 0 },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arcY}px) scale(${(scaleX + 1) / 2}, ${(scaleY + 1) / 2})`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 1, offset: 1 }
          ]
        : [
            { transform: `translate(0,0) scale(1)`, opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 1 }
          ];

    ghost.animate(keyframes, {
        duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
    }).onfinish = () => {
        if (onDone) onDone(); // revela destino ANTES de remover o ghost
        ghost.remove();
    };
}

// Interações
function moveFromDeckToInput(deckIndex, char) {
    const deckWrapper = ui.deckArea.querySelector(`.sphere-wrapper[data-deck-index='${deckIndex}']`);
    const startRect = deckWrapper ? deckWrapper.getBoundingClientRect() : null;

    gameState.inputLetters.push({ char, deckIndex });
    const inputIdx = gameState.inputLetters.length - 1;
    
    // Renderiza input com a nova letra já invisível
    renderInput(inputIdx);
    renderDeck();

    if (startRect) {
        const filledSlot = ui.inputArea.querySelector(`.sphere-wrapper[data-input-slot='${inputIdx}']`);
        if (filledSlot) {
            const destRect = filledSlot.getBoundingClientRect();
            const destSphere = filledSlot.querySelector('.input-letter');
            
            animateFLIPGhost(char, startRect, destRect, {
                onDone: () => {
                    if (destSphere) {
                        destSphere.style.opacity = '1';
                        requestAnimationFrame(() => {
                            destSphere.style.transition = '';
                            destSphere.style.opacity = '';
                        });
                    }
                }
            });
        }
    }
}

function moveFromInputToDeck(inputIndex) {
    const inputWrapper = ui.inputArea.querySelector(`.sphere-wrapper[data-input-slot='${inputIndex}']`);
    const startRect = inputWrapper ? inputWrapper.getBoundingClientRect() : null;
    const item = gameState.inputLetters[inputIndex];

    gameState.inputLetters.splice(inputIndex, 1);
    renderInput();
    // Renderiza o deck já com a esfera destino oculta (sem transição) para evitar flash
    renderDeck(item ? item.deckIndex : -1);

    if (startRect && item) {
        const destWrapper = ui.deckArea.querySelector(`.sphere-wrapper[data-deck-index='${item.deckIndex}']`);
        if (destWrapper) {
            const destRect = destWrapper.getBoundingClientRect();
            const destSphere = destWrapper.querySelector('.deck-letter');
            animateFLIPGhost(item.char, startRect, destRect, {
                onDone: () => {
                    if (destSphere) {
                        destSphere.style.opacity = '1';
                        requestAnimationFrame(() => {
                            destSphere.style.transition = '';
                            destSphere.style.opacity = '';
                        });
                    }
                }
            });
        }
    }
}

function shuffleDeck() {
    // 1. Captura posição EXATA de cada wrapper antes de mexer em nada
    const wrappers  = Array.from(ui.deckArea.querySelectorAll('.sphere-wrapper'));
    const oldRects  = wrappers.map(w => w.getBoundingClientRect());
    const oldChars  = [...gameState.deckLetters];

    // 2. Cria uma permutação de índices e embaralha
    const perm = oldChars.map((_, i) => i);
    shuffleArray(perm);

    // 3. Aplica a permutação ao array de letras
    gameState.deckLetters = perm.map(i => oldChars[i]);

    // 4. Limpa input e re-renderiza o deck com todas as esferas já ocultas (sem transição)
    gameState.inputLetters = [];
    renderInput();
    renderDeck(-1, true); 

    // 5. Captura as referências das esferas e as NOVAS posições dos wrappers
    const GHOST_DURATION = 400;
    const newSpheres = Array.from(ui.deckArea.querySelectorAll('.deck-letter'));
    const newWrappers = Array.from(ui.deckArea.querySelectorAll('.sphere-wrapper'));
    const newRects = newWrappers.map(w => w.getBoundingClientRect());

    // 6. Para cada nova posição, lança um ghost com arco vertical
    perm.forEach((oldIdx, newIdx) => {
        const char      = oldChars[oldIdx];
        const startRect = oldRects[oldIdx]; 
        const endRect   = newRects[newIdx]; 
        const delay     = newIdx * 30; 
        const arcY      = (Math.random() - 0.5) * 50;

        setTimeout(() => {
            animateFLIPGhost(char, startRect, endRect, {
                duration: GHOST_DURATION,
                arcY,
                onDone: () => {
                    const s = newSpheres[newIdx];
                    if (s) {
                        s.style.opacity = '1';
                        requestAnimationFrame(() => {
                            s.style.transition = '';
                            s.style.opacity = '';
                        });
                    }
                }
            });
        }, delay);
    });
}

function returnAllLettersWithAnimation() {
    if (gameState.inputLetters.length === 0) return;

    const itemsToReturn = [...gameState.inputLetters];
    const inputWrappers = Array.from(ui.inputArea.querySelectorAll('.sphere-wrapper'));
    const startRects = inputWrappers.map(w => w.getBoundingClientRect());

    gameState.inputLetters = [];
    renderInput();
    
    // Oculta as letras destino no deck que estão voltando
    const hiddenIndices = itemsToReturn.map(item => item.deckIndex);
    renderDeck(hiddenIndices);

    itemsToReturn.forEach((item, i) => {
        if (!startRects[i]) return;
        const destWrapper = ui.deckArea.querySelector(`.sphere-wrapper[data-deck-index='${item.deckIndex}']`);
        if (destWrapper) {
            const destRect = destWrapper.getBoundingClientRect();
            const destSphere = destWrapper.querySelector('.deck-letter');
            
            animateFLIPGhost(item.char, startRects[i], destRect, {
                onDone: () => {
                    if (destSphere) {
                        destSphere.style.opacity = '1';
                        requestAnimationFrame(() => {
                            destSphere.style.transition = '';
                            destSphere.style.opacity = '';
                        });
                    }
                }
            });
        }
    });
}

function submitWord() {
    if (gameState.revealed) return;
    if (gameState.inputLetters.length < 3) return;

    const formedWord = gameState.inputLetters.map(item => item.char).join('');

    const wordObj = gameState.validWordsForLevel.find(w => w.unaccentedWord === formedWord);

    if (wordObj) {
        if (wordObj.found) {
            showFeedback(ui.inputArea, 'shake');
            showToast('Você já encontrou<br>essa palavra kkk', 'emoji_kkk.png');
            // Retorna ao deck após o feedback com animação
            setTimeout(() => {
                returnAllLettersWithAnimation();
            }, 400);
        } else {
            wordObj.found = true;
            addScore(wordObj.length);
            showFeedback(ui.inputArea, 'success-bg');

            // Limpa o input imediatamente com animação para processar o acerto
            returnAllLettersWithAnimation();

            // ... restante da lógica de acerto (board, master word, etc)
            renderBoard();
            const allRows = ui.wordsBoard.querySelectorAll('.word-row');
            allRows.forEach(row => {
                if (row.dataset.word === wordObj.word) {
                    const slots = row.querySelectorAll('.letter-slot.filled, .letter-slot.master');
                    slots.forEach((slot, i) => {
                        slot.classList.add('flip-reveal');
                        slot.style.animationDelay = `${i * 60}ms`;
                        slot.addEventListener('animationend', () => {
                            slot.classList.remove('flip-reveal');
                            slot.style.animationDelay = '';
                        }, { once: true });
                    });
                }
            });

            if (wordObj.isMaster && !gameState.masterWordFound) {
                gameState.masterWordFound = true;
                ui.nextLevelBtn.classList.remove('hidden');

                setTimeout(() => {
                    const appEl = document.getElementById('app');
                    appEl.classList.add('screen-shake');
                    appEl.addEventListener('animationend', () => appEl.classList.remove('screen-shake'), { once: true });

                    allRows.forEach(row => {
                        if (row.dataset.word === wordObj.word) {
                            row.querySelectorAll('.letter-slot').forEach((slot, i) => {
                                setTimeout(() => {
                                    slot.classList.add('neon-glow');
                                    slot.addEventListener('animationend', () => slot.classList.remove('neon-glow'), { once: true });
                                }, i * 80);
                            });
                        }
                    });

                    fireConfetti();

                    setTimeout(() => {
                        showModal("✨ Palavra Mestre!", "Você encontrou a palavra que usa todas as letras. Avance ou continue para mais pontos!", "Continuar", closeModal);
                    }, 800);
                }, 400);
            }

            if (gameState.validWordsForLevel.every(w => w.found)) {
                setTimeout(() => {
                    showModal("Nível Concluído!", "Você encontrou TODAS as palavras ocultas!", "Próximo Nível", nextLevel);
                }, 600);
            }
        }
    } else {
        // Erro: Palavra não existe
        showFeedback(ui.inputArea, 'error-bg');
        showFeedback(ui.inputArea, 'shake');
        
        setTimeout(() => {
            returnAllLettersWithAnimation();
        }, 500);
    }
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

/**
 * Dispara partículas de confete do centro da tela.
 */
function fireConfetti() {
    const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e'];
    const count  = 60;
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-particle';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(el);

        const angle  = Math.random() * Math.PI * 2;
        const speed  = 120 + Math.random() * 200;
        const vx     = Math.cos(angle) * speed;
        const vy     = Math.sin(angle) * speed - 150; // impulso para cima
        const rotate = Math.random() * 720 - 360;
        const size   = 6 + Math.random() * 8;

        el.style.width  = size + 'px';
        el.style.height = size + 'px';

        el.animate([
            {
                transform: `translate(${cx}px, ${cy}px) rotate(0deg)`,
                opacity: 1
            },
            {
                transform: `translate(${cx + vx}px, ${cy + vy + 300}px) rotate(${rotate}deg)`,
                opacity: 0
            }
        ], {
            duration: 900 + Math.random() * 600,
            delay:    Math.random() * 200,
            easing:   'cubic-bezier(0.23, 1, 0.32, 1)',
            fill:     'forwards'
        }).onfinish = () => el.remove();
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
function showToast(message, imageUrl = null) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'toast-icon';
        toast.appendChild(img);
    }

    const textSpan = document.createElement('span');
    textSpan.innerHTML = message;
    toast.appendChild(textSpan);

    container.appendChild(toast);

    // Remove o elemento após a animação (3 segundos total conforme CSS)
    setTimeout(() => {
        toast.remove();
        // Remove container se estiver vazio
        if (container.childNodes.length === 0) {
            container.remove();
        }
    }, 3000);
}
