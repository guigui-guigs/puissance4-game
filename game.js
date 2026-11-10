// Connect 4 Core Engine & AI Logic
export const ROWS = 6;
export const COLS = 7;
export const EMPTY = 0;
export const PLAYER_RED = 1;   // Host / Player 1
export const PLAYER_YELLOW = 2; // Guest / Player 2 / AI

export class Connect4Engine {
  constructor() {
    this.reset();
  }

  reset() {
    // 6 rows x 7 cols grid (0 = empty, 1 = red, 2 = yellow)
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    this.turn = PLAYER_RED;
    this.winner = null; // null | 1 | 2 | 'draw'
    this.winningLine = []; // array of [r, c]
    this.movesHistory = [];
  }

  isValidCol(col) {
    return col >= 0 && col < COLS && this.board[0][col] === EMPTY && !this.winner;
  }

  getAvailableRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === EMPTY) {
        return r;
      }
    }
    return -1;
  }

  dropDisc(col, player = this.turn) {
    if (!this.isValidCol(col)) return null;

    const row = this.getAvailableRow(col);
    if (row === -1) return null;

    this.board[row][col] = player;
    this.movesHistory.push({ row, col, player });

    const winResult = this.checkWin(row, col, player);
    if (winResult) {
      this.winner = player;
      this.winningLine = winResult;
    } else if (this.isBoardFull()) {
      this.winner = 'draw';
    } else {
      this.turn = (this.turn === PLAYER_RED) ? PLAYER_YELLOW : PLAYER_RED;
    }

    return { row, col, player, winner: this.winner, winningLine: this.winningLine };
  }

  checkWin(row, col, player) {
    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right \
      { dr: 1, dc: -1 }, // Diagonal down-left /
    ];

    for (const { dr, dc } of directions) {
      const line = [[row, col]];

      // Check positive direction
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === player) {
        line.push([r, c]);
        r += dr;
        c += dc;
      }

      // Check negative direction
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === player) {
        line.push([r, c]);
        r -= dr;
        c -= dc;
      }

      if (line.length >= 4) {
        return line;
      }
    }
    return null;
  }

  isBoardFull() {
    return this.board[0].every(cell => cell !== EMPTY);
  }

  getValidCols() {
    const cols = [];
    // Prioritize center columns for better moves
    const order = [3, 2, 4, 1, 5, 0, 6];
    for (const c of order) {
      if (this.isValidCol(c)) cols.push(c);
    }
    return cols;
  }

  // AI Minimax logic for Solo Mode
  getBestMove(difficulty = 'medium') {
    const validCols = this.getValidCols();
    if (validCols.length === 0) return null;

    // Easy: 70% random, 30% check immediate win
    if (difficulty === 'easy') {
      // Check if AI can win in 1 move
      for (const col of validCols) {
        const row = this.getAvailableRow(col);
        if (this.checkWin(row, col, PLAYER_YELLOW)) return col;
      }
      return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // Medium & Hard: Minimax with alpha-beta pruning
    const maxDepth = (difficulty === 'hard') ? 5 : 3;

    // Check immediate win first
    for (const col of validCols) {
      const row = this.getAvailableRow(col);
      if (this.checkWin(row, col, PLAYER_YELLOW)) return col;
    }

    // Check immediate block of human win
    for (const col of validCols) {
      const row = this.getAvailableRow(col);
      if (this.checkWin(row, col, PLAYER_RED)) return col;
    }

    let bestScore = -Infinity;
    let bestCol = validCols[0];

    for (const col of validCols) {
      const row = this.getAvailableRow(col);
      this.board[row][col] = PLAYER_YELLOW;
      const score = this.minimax(maxDepth - 1, -Infinity, Infinity, false);
      this.board[row][col] = EMPTY;

      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
    }

    return bestCol;
  }

  minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0 || this.isBoardFull()) {
      return this.evaluateBoard();
    }

    const validCols = this.getValidCols();

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const col of validCols) {
        const row = this.getAvailableRow(col);
        if (this.checkWin(row, col, PLAYER_YELLOW)) return 1000 + depth;
        this.board[row][col] = PLAYER_YELLOW;
        const ev = this.minimax(depth - 1, alpha, beta, false);
        this.board[row][col] = EMPTY;
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const col of validCols) {
        const row = this.getAvailableRow(col);
        if (this.checkWin(row, col, PLAYER_RED)) return -1000 - depth;
        this.board[row][col] = PLAYER_RED;
        const ev = this.minimax(depth - 1, alpha, beta, true);
        this.board[row][col] = EMPTY;
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  evaluateBoard() {
    let score = 0;
    // Reward center column control
    const centerCol = 3;
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
      if (this.board[r][centerCol] === PLAYER_YELLOW) centerCount++;
      if (this.board[r][centerCol] === PLAYER_RED) centerCount--;
    }
    score += centerCount * 6;
    return score;
  }
}
