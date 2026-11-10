import { Connect4Engine, ROWS, COLS, PLAYER_RED, PLAYER_YELLOW } from './game.js';
import { NetworkManager } from './network.js';
import { sounds } from './audio.js';

// Application State
let mode = 'lobby'; // 'lobby' | 'online-host' | 'online-guest' | 'local' | 'ai'
let myPlayerId = PLAYER_RED; // in online mode: host is RED (1), guest is YELLOW (2)
let scores = { [PLAYER_RED]: 0, [PLAYER_YELLOW]: 0 };

const engine = new Connect4Engine();
let network = null;

// DOM Elements
const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');
const boardEl = document.getElementById('board');
const columnGuidesEl = document.getElementById('column-guides');
const statusBanner = document.getElementById('status-banner');
const player1Badge = document.getElementById('player1-badge');
const player2Badge = document.getElementById('player2-badge');
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');
const scoreP1El = document.getElementById('score-p1');
const scoreP2El = document.getElementById('score-p2');
const soundBtn = document.getElementById('sound-btn');
const reactionsOverlay = document.getElementById('reactions-overlay');

// Modal Elements
const shareModal = document.getElementById('share-modal');
const shareLinkInput = document.getElementById('share-link-input');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnCancelShare = document.getElementById('btn-cancel-share');

// Initialize Board DOM
function initBoardDOM() {
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const hole = document.createElement('div');
      hole.className = 'hole';
      cell.appendChild(hole);

      cell.addEventListener('click', () => handleColumnClick(c));
      boardEl.appendChild(cell);
    }
  }

  // Column Guides Click Events
  const guides = columnGuidesEl.querySelectorAll('.column-guide');
  guides.forEach((g) => {
    const c = parseInt(g.dataset.col, 10);
    g.addEventListener('click', () => handleColumnClick(c));
    g.addEventListener('mouseenter', () => updateGuideIndicators(c));
  });
}

function updateGuideIndicators(hoveredCol = null) {
  const isMyTurn = (mode === 'local') || 
                   (mode === 'ai' && engine.turn === PLAYER_RED) ||
                   ((mode === 'online-host' || mode === 'online-guest') && engine.turn === myPlayerId);

  const currentColor = engine.turn === PLAYER_RED ? 'red' : 'yellow';
  const guides = columnGuidesEl.querySelectorAll('.guide-indicator');

  guides.forEach((indicator, colIdx) => {
    indicator.className = `guide-indicator ${currentColor}`;
    if (!isMyTurn || engine.winner || !engine.isValidCol(colIdx)) {
      indicator.style.opacity = '0';
    } else if (hoveredCol === colIdx) {
      indicator.style.opacity = '0.9';
    } else {
      indicator.style.opacity = '';
    }
  });
}

// User Action: Play Move in Column
function handleColumnClick(col) {
  if (engine.winner) return;

  // Check turn permissions
  if (mode === 'ai' && engine.turn !== PLAYER_RED) return;
  if ((mode === 'online-host' || mode === 'online-guest') && engine.turn !== myPlayerId) {
    return; // Not your turn
  }

  if (!engine.isValidCol(col)) return;

  // Play move locally
  executeMove(col, engine.turn);

  // If online, broadcast move to opponent
  if (network && network.connected) {
    network.send({ type: 'move', col });
  }

  // If AI mode, trigger AI move
  if (mode === 'ai' && !engine.winner && engine.turn === PLAYER_YELLOW) {
    setTimeout(handleAIMove, 450);
  }
}

function handleAIMove() {
  if (engine.winner || mode !== 'ai') return;
  const bestCol = engine.getBestMove('medium');
  if (bestCol !== null) {
    executeMove(bestCol, PLAYER_YELLOW);
  }
}

// Apply move to engine and animate DOM
function executeMove(col, player) {
  const result = engine.dropDisc(col, player);
  if (!result) return;

  sounds.playDrop();

  // Animate chip drop in DOM
  animateDiscDrop(result.row, col, player, () => {
    if (result.winner) {
      handleGameOver(result.winner, result.winningLine);
    } else {
      updateUI();
    }
  });

  updateUI();
}

function animateDiscDrop(row, col, player, onComplete) {
  const cell = boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"] .hole`);
  if (!cell) return;

  const disc = document.createElement('div');
  const colorClass = player === PLAYER_RED ? 'red' : 'yellow';
  disc.className = `disc ${colorClass} falling`;

  // Dynamic falling animation height and duration
  const dropHeight = (row + 1) * 70; // approx distance
  const duration = 0.22 + row * 0.045; // lower rows take slightly longer
  disc.style.setProperty('--start-y', `-${dropHeight}px`);
  disc.style.setProperty('--drop-duration', `${duration}s`);

  cell.appendChild(disc);

  setTimeout(() => {
    disc.classList.remove('falling');
    if (onComplete) onComplete();
  }, duration * 1000);
}

function handleGameOver(winner, winningLine) {
  if (winner === 'draw') {
    statusBanner.textContent = 'Match nul !';
    statusBanner.className = 'status-banner';
  } else {
    scores[winner]++;
    scoreP1El.textContent = scores[PLAYER_RED];
    scoreP2El.textContent = scores[PLAYER_YELLOW];

    sounds.playWin();

    // Highlight 4 winning discs
    if (winningLine && winningLine.length) {
      winningLine.forEach(([r, c]) => {
        const winningDisc = boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"] .disc`);
        if (winningDisc) winningDisc.classList.add('winner');
      });
    }

    if (mode === 'local') {
      const winnerName = winner === PLAYER_RED ? 'Joueur 1 (Rouge)' : 'Joueur 2 (Jaune)';
      statusBanner.textContent = `🏆 ${winnerName} a gagné !`;
    } else if (mode === 'ai') {
      statusBanner.textContent = winner === PLAYER_RED ? '🏆 Bravo, vous avez gagné !' : '🤖 L\'ordinateur a gagné !';
    } else {
      statusBanner.textContent = winner === myPlayerId ? '🏆 Félicitations, vous avez gagné !' : '💀 Votre adversaire a gagné !';
    }
    statusBanner.className = 'status-banner win';
  }
}

function updateUI() {
  // Update Active Badge
  if (engine.turn === PLAYER_RED) {
    player1Badge.classList.add('active');
    player2Badge.classList.remove('active');
  } else {
    player2Badge.classList.add('active');
    player1Badge.classList.remove('active');
  }

  // Update Status Banner
  if (!engine.winner) {
    if (mode === 'local') {
      statusBanner.textContent = engine.turn === PLAYER_RED ? 'Au tour du Joueur 1 (Rouge)' : 'Au tour du Joueur 2 (Jaune)';
      statusBanner.className = 'status-banner your-turn';
    } else if (mode === 'ai') {
      statusBanner.textContent = engine.turn === PLAYER_RED ? 'C\'est à votre tour !' : 'L\'IA réfléchit...';
      statusBanner.className = engine.turn === PLAYER_RED ? 'status-banner your-turn' : 'status-banner';
    } else {
      const isMyTurn = engine.turn === myPlayerId;
      statusBanner.textContent = isMyTurn ? 'C\'est à votre tour de jouer !' : 'En attente de l\'adversaire...';
      statusBanner.className = isMyTurn ? 'status-banner your-turn' : 'status-banner';
    }
  }

  updateGuideIndicators();
}

function resetGame() {
  engine.reset();
  initBoardDOM();
  updateUI();
}

// Float emoji reactions
function triggerEmoji(emoji) {
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;
  el.style.left = `${15 + Math.random() * 70}%`;
  reactionsOverlay.appendChild(el);

  setTimeout(() => el.remove(), 1900);
}

// Setup Network Handlers
function setupNetwork() {
  network = new NetworkManager({
    onRoomCreated: (id, url) => {
      shareLinkInput.value = url;
      shareModal.classList.remove('hidden');
    },
    onConnected: ({ isHost }) => {
      sounds.playJoin();
      shareModal.classList.add('hidden');
      document.getElementById('btn-share-link').classList.remove('hidden');

      if (isHost) {
        player1Name.textContent = 'Vous (Hôte)';
        player2Name.textContent = 'Advisaire';
      } else {
        player1Name.textContent = 'Adversaire';
        player2Name.textContent = 'Vous (Invité)';
      }
      switchToGameView();
      resetGame();
    },
    onMessage: (data) => {
      if (data.type === 'move') {
        executeMove(data.col, engine.turn);
      } else if (data.type === 'emoji') {
        triggerEmoji(data.emoji);
      } else if (data.type === 'rematch') {
        if (confirm('Votre adversaire propose une revanche ! Accepter ?')) {
          network.send({ type: 'rematch_accept' });
          resetGame();
        }
      } else if (data.type === 'rematch_accept') {
        alert('Revanche acceptée ! Nouvelle partie.');
        resetGame();
      }
    },
    onDisconnected: () => {
      alert('L\'adversaire s\'est déconnecté.');
      switchToLobbyView();
    },
    onError: (msg) => {
      alert(msg);
      switchToLobbyView();
    }
  });
}

function switchToGameView() {
  lobbyView.classList.add('hidden');
  gameView.classList.remove('hidden');
}

function switchToLobbyView() {
  if (network) {
    network.disconnect();
  }
  // Clear room from URL without page reload
  window.history.replaceState({}, document.title, window.location.pathname);
  gameView.classList.add('hidden');
  lobbyView.classList.remove('hidden');
  shareModal.classList.add('hidden');
}

// Event Listeners

// 1. Create Online Room (Host)
document.getElementById('btn-create-online').addEventListener('click', () => {
  sounds.playClick();
  mode = 'online-host';
  myPlayerId = PLAYER_RED;
  setupNetwork();
  network.createRoom();
});

// 2. Start Local Mode
document.getElementById('btn-start-local').addEventListener('click', () => {
  sounds.playClick();
  mode = 'local';
  player1Name.textContent = 'Joueur 1';
  player2Name.textContent = 'Joueur 2';
  document.getElementById('btn-share-link').classList.add('hidden');
  switchToGameView();
  resetGame();
});

// 3. Start AI Mode
document.getElementById('btn-start-ai').addEventListener('click', () => {
  sounds.playClick();
  mode = 'ai';
  myPlayerId = PLAYER_RED;
  player1Name.textContent = 'Vous';
  player2Name.textContent = 'Robot IA 🤖';
  document.getElementById('btn-share-link').classList.add('hidden');
  switchToGameView();
  resetGame();
});

// 4. Copy Magic Link
btnCopyLink.addEventListener('click', () => {
  sounds.playClick();
  shareLinkInput.select();
  navigator.clipboard.writeText(shareLinkInput.value).then(() => {
    btnCopyLink.textContent = '✓ Copié !';
    setTimeout(() => {
      btnCopyLink.textContent = 'Copier';
    }, 2000);
  });
});

// 5. Cancel Share
btnCancelShare.addEventListener('click', () => {
  sounds.playClick();
  switchToLobbyView();
});

// 6. Share link button inside game
document.getElementById('btn-share-link').addEventListener('click', () => {
  sounds.playClick();
  if (network && network.getShareUrl()) {
    shareLinkInput.value = network.getShareUrl();
    shareModal.classList.remove('hidden');
  }
});

// 7. Restart / Rematch
document.getElementById('btn-restart').addEventListener('click', () => {
  sounds.playClick();
  if (mode === 'online-host' || mode === 'online-guest') {
    if (network && network.connected) {
      network.send({ type: 'rematch' });
      statusBanner.textContent = 'Demande de revanche envoyée...';
    }
  } else {
    resetGame();
  }
});

// 8. Exit / Menu
document.getElementById('btn-exit').addEventListener('click', () => {
  sounds.playClick();
  switchToLobbyView();
});

// 9. Emoji Reactions
document.querySelectorAll('.emoji-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const emoji = btn.dataset.emoji;
    triggerEmoji(emoji);
    if (network && network.connected) {
      network.send({ type: 'emoji', emoji });
    }
  });
});

// 10. Sound Toggle
soundBtn.addEventListener('click', () => {
  const enabled = sounds.toggle();
  soundBtn.textContent = enabled ? '🔊' : '🔇';
});

// Check if URL has ?room=... (Auto-join Magic Link)
window.addEventListener('DOMContentLoaded', () => {
  initBoardDOM();

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (roomId) {
    mode = 'online-guest';
    myPlayerId = PLAYER_YELLOW;
    statusBanner.textContent = 'Connexion à la partie en cours...';
    setupNetwork();
    network.joinRoom(roomId);
  }
});
