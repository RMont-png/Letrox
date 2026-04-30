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
    revealed: false,
    power1Used: false,
    power2Used: false,
    masterSoundPlayed: false
};

// ── SoundManager ─────────────────────────────────────────────────────────
const SoundManager = {
    singles: {
        'acerto': 'sons/acerto.mp3',
        'erro': 'sons/erro.mp3',
        'repetida': 'sons/repetida.mp3',
        'palavra mestra': 'sons/palavra mestra.mp3',
        'completo': 'sons/completo.mp3',
        'poder 01': 'sons/poder 01.mp3',
        'poder 02': 'sons/poder 02.mp3',
        'click': 'sons/click.mp3'
    },
    groups: {
        balls: [
            'sons/balls 3.mp3', 'sons/balls 10.mp3', 'sons/balls 12.mp3',
            'sons/balls 21.mp3', 'sons/balls 22.mp3'
        ],
        tap: ['sons/tap 1.mp3', 'sons/tap 2.mp3', 'sons/tap 3.mp3', 'sons/tap 4.mp3']
    },
    // Configuração central de volumes para facilitar o ajuste manual
    volumes: {
        // Efeitos únicos
        'acerto': 0.5,
        'erro': 0.5,
        'repetida': 0.4,
        'palavra mestra': 0.5,
        'completo': 0.5,
        'poder 01': 0.5,
        'poder 02': 0.5,
        'click': 0.5,

        // Efeitos de grupo (bolinhas)
        'balls 3.mp3': 0.4,
        'balls 10.mp3': 0.4,
        'balls 12.mp3': 0.4,
        'balls 21.mp3': 0.4,
        'balls 22.mp3': 0.4,

        // Efeitos de grupo (taps)
        'tap 1.mp3': 0.1,
        'tap 2.mp3': 0.1,
        'tap 3.mp3': 0.3,
        'tap 4.mp3': 0.3
    },
    _cache: {},
    preload() {
        for (const [name, src] of Object.entries(this.singles)) {
            const a = new Audio(src);
            a.load();
            this._cache[name] = a;
        }
        for (const [group, files] of Object.entries(this.groups)) {
            this._cache[group] = files.map(src => {
                const a = new Audio(src);
                a.load();
                return a;
            });
        }
    },
    play(name) {
        const a = this._cache[name];
        if (!a) return;
        const clone = a.cloneNode();

        // Aplica o volume configurado ou o padrão (0.5)
        clone.volume = this.volumes[name] !== undefined ? this.volumes[name] : 0.5;

        clone.play().catch(() => { });
    },
    playRandom(group) {
        const pool = this._cache[group];
        if (!pool || !pool.length) return;
        const a = pool[Math.floor(Math.random() * pool.length)];
        const clone = a.cloneNode();

        // Extrai o nome do arquivo da URL para buscar o volume específico (ex: "tap 1.mp3")
        const filename = decodeURIComponent(a.src).split('/').pop();

        // Aplica o volume configurado ou o padrão (0.5)
        clone.volume = this.volumes[filename] !== undefined ? this.volumes[filename] : 0.5;

        clone.play().catch(() => { });
    }
};
SoundManager.preload();

// ── ImageManager ─────────────────────────────────────────────────────────
const ImageManager = {
    images: [
        'emoji_kkk.png'
    ],
    _cache: {},
    preload() {
        this.images.forEach(src => {
            const img = new Image();
            img.src = src;
            this._cache[src] = img;
        });
    }
};
ImageManager.preload();

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
    modalBtn: document.getElementById('modal-btn'),
    hintBtn: document.getElementById('hint-btn'),
    powersModal: document.getElementById('powers-modal'),
    closePowersBtn: document.getElementById('close-powers-btn'),
    powerFirstLetter: document.getElementById('power-first-letter'),
    powerRandomLetter: document.getElementById('power-random-letter'),
    rulesModal: document.getElementById('rules-modal'),
    closeRulesBtn: document.getElementById('close-rules-btn')
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
    ui.backBtn.textContent = "⬅";
    ui.scoreDisplay.textContent = "0000";
    loadLevel();
}

function showRules() {
    ui.rulesModal.classList.remove('hidden');
}

function backToMenu() {
    // Mesma lógica de revelar palavras se houver alguma
    const missedWords = gameState.validWordsForLevel.filter(w => !w.found);

    if (missedWords.length > 0 && !gameState.revealed) {
        gameState.revealed = true;
        missedWords.forEach(w => w.revealed = true);
        renderBoard();
        ui.backBtn.textContent = "🚪";
        disableFooter(true);
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
    gameState.power1Used = false;
    gameState.power2Used = false;
    gameState.masterSoundPlayed = false;

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
    ui.nextLevelBtn.disabled = true;
    disableFooter(false);
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

    const totalWords = gameState.validWordsForLevel.length;
    const maxWordLen = gameState.currentMasterWord.length;

    const container = ui.wordsBoard.parentElement;
    const containerPaddingV = 40; // 15px top + 15px bottom + 10px safety margin
    const containerPaddingH = 30; // 15px left + 15px right
    const availableH = Math.max(100, container.clientHeight - containerPaddingV);
    const availableW = Math.max(100, container.clientWidth - containerPaddingH);

    const itemGapV = 4;  // gap entre linhas dentro da coluna
    const itemGapH = 2;  // gap entre letras dentro de uma linha
    const colGap = 12; // gap entre colunas

    let bestSlotSize = 0;
    let bestNumCols = 1;

    // Itera pelo número de colunas e encontra o que maximiza o slotSize
    for (let cols = 1; cols <= totalWords; cols++) {
        // Largura por coluna: se já ficou impossível não adianta tentar mais colunas
        const maxByW = Math.floor(
            (availableW + itemGapH - (cols - 1) * colGap) / cols / maxWordLen - itemGapH
        );
        if (maxByW < 8) break; // mais colunas só piora a largura

        const wordsPerCol = Math.ceil(totalWords / cols);
        const maxByH = Math.floor((availableH + itemGapV) / wordsPerCol - itemGapV);

        const slotSize = Math.min(maxByH, maxByW);

        if (slotSize > bestSlotSize) {
            bestSlotSize = slotSize;
            bestNumCols = cols;
        }
    }

    // Garante mínimo de 8px e máximo estético de 36px
    bestSlotSize = Math.min(36, Math.max(12, bestSlotSize));

    document.documentElement.style.setProperty('--slot-size', `${bestSlotSize}px`);
    document.documentElement.style.setProperty('--slot-font', `${Math.round(bestSlotSize * 0.65)}px`);

    // Distribui palavras entre colunas de forma balanceada (diferença máxima de 1)
    const basePerCol = Math.floor(totalWords / bestNumCols);
    const extra = totalWords % bestNumCols; // primeiras `extra` colunas levam +1
    // Monta array com o limite de cada coluna
    const colLimits = [];
    let acc = 0;
    for (let c = 0; c < bestNumCols; c++) {
        acc += basePerCol + (c < extra ? 1 : 0);
        colLimits.push(acc);
    }

    let currentColDiv;
    let colIdx = 0;


    // gameState.validWordsForLevel já está ordenado por tamanho
    gameState.validWordsForLevel.forEach((item, index) => {
        // Cria nova coluna quando ultrapassa o limite da coluna atual
        if (!currentColDiv || index >= colLimits[colIdx]) {
            if (currentColDiv) colIdx++;
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
            } else if (item.revealedIndexes && item.revealedIndexes.includes(i)) {
                slot.textContent = item.word[i];
                slot.classList.add('hint-revealed');
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
            letterDiv.addEventListener('touchstart', (e) => {
                e.preventDefault();
                moveFromInputToDeck(i);
            }, { passive: false });
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
        const isUsed = gameState.inputLetters.some(item => item && item.deckIndex === index);

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
        letterDiv.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!isUsed) moveFromDeckToInput(index, char);
        }, { passive: false });
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
    const { duration = 300, arcY = 0, delay = 0, onDone } = options;

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

    const dx = destRect.left - startRect.left;
    const dy = destRect.top - startRect.top;
    const scaleX = destRect.width / startRect.width;
    const scaleY = destRect.height / startRect.height;

    const scaleMultiplier = 1.3; // Cresce 30% no meio para dar efeito de salto
    const midScaleX = ((scaleX + 1) / 2) * scaleMultiplier;
    const midScaleY = ((scaleY + 1) / 2) * scaleMultiplier;

    const keyframes = arcY !== 0
        ? [
            { transform: `translate(0,0) scale(1)`, opacity: 1, offset: 0 },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arcY}px) scale(${midScaleX}, ${midScaleY})`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 1, offset: 1 }
        ]
        : [
            { transform: `translate(0,0) scale(1)`, opacity: 1, offset: 0 },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(${midScaleX}, ${midScaleY})`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 1, offset: 1 }
        ];

    ghost.animate(keyframes, {
        duration,
        delay,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'both'
    }).onfinish = () => {
        if (onDone) onDone(); // revela destino ANTES de remover o ghost
        ghost.remove();
    };
}

// Interações
function moveFromDeckToInput(deckIndex, char) {
    SoundManager.playRandom('balls');
    const deckWrapper = ui.deckArea.querySelector(`.sphere-wrapper[data-deck-index='${deckIndex}']`);
    const startRect = deckWrapper ? deckWrapper.getBoundingClientRect() : null;

    let emptyIndex = gameState.inputLetters.findIndex(item => item === null);
    if (emptyIndex === -1) {
        if (gameState.inputLetters.length >= gameState.deckLetters.length) return;
        emptyIndex = gameState.inputLetters.length;
        gameState.inputLetters.push({ char, deckIndex });
    } else {
        gameState.inputLetters[emptyIndex] = { char, deckIndex };
    }
    const inputIdx = emptyIndex;

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
                    SoundManager.playRandom('tap');
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
    SoundManager.playRandom('balls');
    const inputWrapper = ui.inputArea.querySelector(`.sphere-wrapper[data-input-slot='${inputIndex}']`);
    const startRect = inputWrapper ? inputWrapper.getBoundingClientRect() : null;
    const item = gameState.inputLetters[inputIndex];

    gameState.inputLetters[inputIndex] = null;
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
                    SoundManager.playRandom('tap');
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
    const wrappers = Array.from(ui.deckArea.querySelectorAll('.sphere-wrapper'));
    const oldRects = wrappers.map(w => w.getBoundingClientRect());
    const oldChars = [...gameState.deckLetters];

    // 2. Cria uma permutação de índices e embaralha
    const perm = oldChars.map((_, i) => i);
    shuffleArray(perm);

    // 3. Aplica a permutação ao array de letras
    gameState.deckLetters = perm.map(i => oldChars[i]);

    // Atualiza os deckIndex no inputLetters para refletir a nova permutação
    gameState.inputLetters.forEach(item => {
        if (item) {
            const newIndex = perm.findIndex(oldIdx => oldIdx === item.deckIndex);
            item.deckIndex = newIndex;
        }
    });

    renderDeck(-1, true);

    // 5. Captura as referências das esferas e as NOVAS posições dos wrappers
    const GHOST_DURATION = 600;
    const newSpheres = Array.from(ui.deckArea.querySelectorAll('.deck-letter'));
    const newWrappers = Array.from(ui.deckArea.querySelectorAll('.sphere-wrapper'));
    const newRects = newWrappers.map(w => w.getBoundingClientRect());

    // 6. Para cada nova posição, lança um ghost com arco vertical
    perm.forEach((oldIdx, newIdx) => {
        const isUsed = gameState.inputLetters.some(item => item && item.deckIndex === newIdx);
        if (isUsed) return; // Não anima bolinhas que já estão no input

        const char = oldChars[oldIdx];
        const startRect = oldRects[oldIdx];
        const endRect = newRects[newIdx];
        const delay = newIdx * 30;
        const arcY = (Math.random() - 0.5) * 120;

        // Som de "clique" sincronizado com o início de cada ghost
        setTimeout(() => SoundManager.playRandom('balls'), delay);

        animateFLIPGhost(char, startRect, endRect, {
            duration: GHOST_DURATION,
            delay: delay,
            arcY,
            onDone: () => {
                SoundManager.playRandom('tap');
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
    });
}

function returnAllLettersWithAnimation() {
    const validItems = gameState.inputLetters.map((item, i) => item ? { ...item, inputIdx: i } : null).filter(Boolean);
    if (validItems.length === 0) return;

    gameState.inputLetters = [];
    renderInput();

    // Oculta as letras destino no deck que estão voltando
    const hiddenIndices = validItems.map(item => item.deckIndex);
    renderDeck(hiddenIndices);

    const inputWrappers = Array.from(ui.inputArea.querySelectorAll('.sphere-wrapper'));
    const allInputRects = inputWrappers.map(w => w.getBoundingClientRect());

    validItems.forEach((item) => {
        const startRect = allInputRects[item.inputIdx];
        if (!startRect) return;

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
    });
}

function submitWord() {
    if (gameState.revealed) return;
    const validItems = gameState.inputLetters.filter(Boolean);
    if (validItems.length < 3) return;

    const formedWord = validItems.map(item => item.char).join('');

    const wordObj = gameState.validWordsForLevel.find(w => w.unaccentedWord === formedWord);

    if (wordObj) {
        if (wordObj.found) {
            SoundManager.play('repetida');
            showFeedback(ui.inputArea, 'shake');
            showToast('Você já encontrou<br>essa palavra kkk', 'emoji_kkk.png');
            // Retorna ao deck após o feedback com animação
            setTimeout(() => {
                returnAllLettersWithAnimation();
            }, 400);
        } else {
            wordObj.found = true;
            let playedMasterSound = false;
            if (wordObj.isMaster && !gameState.masterSoundPlayed) {
                gameState.masterSoundPlayed = true;
                playedMasterSound = true;
                SoundManager.play('palavra mestra');
            } else {
                SoundManager.play('acerto');
            }
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
                ui.nextLevelBtn.disabled = false;

                setTimeout(() => {
                    // Sem screen-shake a pedido

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
                        showModal("Palavra Mestra encontrada!", "Agora você já pode passar para a próxima fase.", "Continuar", closeModal);
                    }, 200); // Aparece quase junto com o início da explosão
                }, 400);
            }

            if (gameState.validWordsForLevel.every(w => w.found)) {
                setTimeout(() => {
                    fireConfetti();
                    if (!playedMasterSound) {
                        SoundManager.play('completo');
                    }

                    setTimeout(() => {
                        showModal("Nível Concluído!", "Parabéns! Você encontrou TODAS as palavras ocultas!", "Próximo Nível", nextLevel);
                    }, 200);
                }, 400);
            }
        }
    } else {
        // Erro: Palavra não existe
        SoundManager.play('erro');
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
    ui.scoreDisplay.textContent = gameState.score.toString().padStart(4, '0');
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
        disableFooter(true);
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

function disableFooter(disabled = true) {
    ui.submitBtn.disabled = disabled;
    ui.shuffleBtn.disabled = disabled;
    ui.hintBtn.disabled = disabled;
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
    const count = 150;
    const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-particle';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(el);

        // Explosão 360 graus a partir do centro (CSS já posiciona no top 50% left 50%)
        const angle = Math.random() * Math.PI * 2;
        const speed = 200 + Math.random() * 600;

        // Posição final baseada no ângulo e velocidade
        const vx = Math.cos(angle) * speed * (window.innerWidth / 400); // Espalha mais se tela larga
        const vy = Math.sin(angle) * speed; // Círculo completo
        const rotate = Math.random() * 720 - 360;
        const size = 8 + Math.random() * 12;

        el.style.width = size + 'px';
        el.style.height = size + 'px';

        el.animate([
            {
                transform: `translate(-50%, -50%) rotate(0deg) scale(1)`,
                opacity: 1
            },
            {
                transform: `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px)) rotate(${rotate}deg) scale(0.5)`,
                opacity: 0
            }
        ], {
            duration: 1200 + Math.random() * 800,
            delay: Math.random() * 200,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Desacelera no final (explosão)
            fill: 'forwards'
        }).onfinish = () => el.remove();
    }
}

// ── Sensores (Chacoalhar) ───────────────────────────────────────────────
let lastShakeTime = 0;
let lastX = null, lastY = null, lastZ = null;

function handleMotion(event) {
    // Só funciona no meio do jogo
    if (ui.gameScreen.classList.contains('hidden') || !ui.modal.classList.contains('hidden')) return;

    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    const { x, y, z } = acc;

    if (lastX !== null) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);

        // Limite para detectar um chacoalhão (15 é um valor comum)
        const threshold = 15;

        if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
            const now = Date.now();
            // Cooldown de 1 segundo para não chamar múltiplas vezes
            if (now - lastShakeTime > 1000) {
                lastShakeTime = now;
                shuffleDeck();
            }
        }
    }

    lastX = x;
    lastY = y;
    lastZ = z;
}

async function requestShakePermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            }
        } catch (error) {
            console.error("Erro ao pedir permissão do acelerômetro:", error);
        }
    } else {
        // Para navegadores que não exigem permissão
        window.addEventListener('devicemotion', handleMotion);
    }
}

ui.shuffleBtn.addEventListener('click', shuffleDeck);
ui.submitBtn.addEventListener('click', submitWord);
ui.nextLevelBtn.addEventListener('click', nextLevel);
ui.playBtn.addEventListener('click', () => {
    requestShakePermission();
    startGame();
});
ui.rulesBtn.addEventListener('click', showRules);
ui.backBtn.addEventListener('click', backToMenu);
ui.closeRulesBtn.addEventListener('click', () => ui.rulesModal.classList.add('hidden'));

// Som de clique global para botões
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && !btn.disabled) {
        SoundManager.play('click');
    }
});


// Poderes
ui.hintBtn.addEventListener('click', () => {
    ui.powerFirstLetter.disabled = gameState.power1Used;
    ui.powerRandomLetter.disabled = gameState.power2Used;
    ui.powersModal.classList.remove('hidden');
});

ui.closePowersBtn.addEventListener('click', () => ui.powersModal.classList.add('hidden'));

ui.powerFirstLetter.addEventListener('click', () => {
    if (gameState.power1Used) return;
    gameState.power1Used = true;
    ui.powersModal.classList.add('hidden');
    SoundManager.play('poder 01');

    let delayCounter = 0;
    gameState.validWordsForLevel.forEach(wordObj => {
        if (!wordObj.found) {
            if (!wordObj.revealedIndexes) wordObj.revealedIndexes = [];
            if (!wordObj.revealedIndexes.includes(0)) {
                wordObj.revealedIndexes.push(0);

                const row = ui.wordsBoard.querySelector(`.word-row[data-word="${wordObj.word}"]`);
                if (row) {
                    const slot = row.querySelectorAll('.letter-slot')[0];
                    if (slot) {
                        setTimeout(() => {
                            slot.textContent = wordObj.word[0];
                            slot.classList.add('hint-revealed', 'flip-reveal');
                            slot.addEventListener('animationend', () => slot.classList.remove('flip-reveal'), { once: true });
                        }, delayCounter * 80);
                        delayCounter++;
                    }
                }
            }
        }
    });
});

ui.powerRandomLetter.addEventListener('click', () => {
    if (gameState.power2Used) return;
    gameState.power2Used = true;
    ui.powersModal.classList.add('hidden');
    SoundManager.play('poder 02');

    let delayCounter = 0;
    gameState.validWordsForLevel.forEach(wordObj => {
        if (!wordObj.found) {
            if (!wordObj.revealedIndexes) wordObj.revealedIndexes = [];
            const availableIndexes = [];
            for (let i = 1; i < wordObj.length; i++) {
                if (!wordObj.revealedIndexes.includes(i)) availableIndexes.push(i);
            }
            if (availableIndexes.length > 0) {
                const randomIdx = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
                wordObj.revealedIndexes.push(randomIdx);

                const row = ui.wordsBoard.querySelector(`.word-row[data-word="${wordObj.word}"]`);
                if (row) {
                    const slot = row.querySelectorAll('.letter-slot')[randomIdx];
                    if (slot) {
                        setTimeout(() => {
                            slot.textContent = wordObj.word[randomIdx];
                            slot.classList.add('hint-revealed', 'flip-reveal');
                            slot.addEventListener('animationend', () => slot.classList.remove('flip-reveal'), { once: true });
                        }, delayCounter * 80);
                        delayCounter++;
                    }
                }
            }
        }
    });
});

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
