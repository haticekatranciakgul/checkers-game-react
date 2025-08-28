// src/utils/rules.js
const COLS = 8;
const ROWS = 8;

export function coordToIndex(file, rank) {
  const col = file.charCodeAt(0) - "a".charCodeAt(0);
  const row = rank - 1;
  return row * 8 + col;
}
export function indexToCoord(idx) {
  const row = Math.floor(idx / 8);
  const col = idx % 8;
  return { file: String.fromCharCode("a".charCodeAt(0) + col), rank: row + 1 };
}

export function createInitialBoard() {
  const b = new Array(64).fill(null);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * 8 + c;
      const rank = r + 1;
      if (rank === 2 || rank === 3) {
        b[idx] = { player: "A", isKing: false };
      } else if (rank === 6 || rank === 7) {
        b[idx] = { player: "B", isKing: false };
      } else {
        b[idx] = null;
      }
    }
  }
  return b;
}

function rowOf(idx) { return Math.floor(idx / 8) + 1; }
function colOf(idx) { return (idx % 8) + 1; }
function inBoard(r, c) { return r >= 1 && r <= ROWS && c >= 1 && c <= COLS; }
function cloneBoard(b){ return JSON.parse(JSON.stringify(b)); }
function opponent(player){ return player === "A" ? "B" : "A"; }

export function generateAllMovesForPlayer(board, player) {
  const moves = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.player !== player) continue;
    if (!p.isKing) {
      const r = rowOf(i);
      const c = colOf(i);
      const forward = player === "A" ? r + 1 : r - 1;
      if (inBoard(forward, c)) {
        const idx = (forward - 1) * 8 + (c - 1);
        if (board[idx] === null) moves.push({ start: i, to: idx, type: "move" });
      }
      for (let dc of [-1, 1]) {
        const nc = c + dc;
        if (inBoard(r, nc)) {
          const idx = (r - 1) * 8 + (nc - 1);
          if (board[idx] === null) moves.push({ start: i, to: idx, type: "move" });
        }
      }
    } else {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dr,dc] of dirs) {
        let rr = rowOf(i);
        let cc = colOf(i);
        while (true) {
          rr += dr; cc += dc;
          if (!inBoard(rr,cc)) break;
          const tgt = (rr-1)*8 + (cc-1);
          if (board[tgt] !== null) break;
          moves.push({ start: i, to: tgt, type: "move" });
        }
      }
    }
  }
  return moves;
}

export function generateAllCapturesForPlayer(board, player, settings) {
  const all = [];
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece || piece.player !== player) continue;
    const seqs = generateCapturesFrom(board, i, piece.isKing, player, settings);
    for (const seq of seqs) {
      all.push({ start: i, seq });
    }
  }
  if (all.length === 0) return [];
  let maxCaptured = 0;
  for (const a of all) {
    if (a.seq.length > maxCaptured) maxCaptured = a.seq.length;
  }
  const filtered = all.filter(a => a.seq.length === maxCaptured);
  return filtered;
}

function generateCapturesFrom(board, startIdx, isKing, player, settings){
  const sequences = [];

  if (!isKing) {
    const r = rowOf(startIdx);
    const c = colOf(startIdx);
    const dirs = [];
    if (player === "A") dirs.push([1,0]); else dirs.push([-1,0]);
    dirs.push([0,-1],[0,1]);

    for (const [dr,dc] of dirs) {
      const midr = r + dr;
      const midc = c + dc;
      const landr = r + 2*dr;
      const landc = c + 2*dc;
      if (!inBoard(midr,midc) || !inBoard(landr,landc)) continue;
      const midIdx = (midr-1)*8 + (midc-1);
      const landIdx = (landr-1)*8 + (landc-1);
      if (board[midIdx] && board[midIdx].player === opponent(player) && board[landIdx] === null) {
        const boardCopy = cloneBoard(board);
        boardCopy[landIdx] = { ...boardCopy[startIdx] };
        boardCopy[startIdx] = null;
        boardCopy[midIdx] = null;
        const landedRank = rowOf(landIdx);
        const promotes = (player === "A" && landedRank === 8) || (player === "B" && landedRank === 1);
        if (promotes) {
          boardCopy[landIdx].isKing = true;
          sequences.push([{ to: landIdx, jumped: midIdx }]);
        } else {
          const nextSeqs = generateCapturesFrom(boardCopy, landIdx, boardCopy[landIdx].isKing, player, settings);
          if (nextSeqs.length === 0) sequences.push([{ to: landIdx, jumped: midIdx }]);
          else {
            for (const ns of nextSeqs) sequences.push([{ to: landIdx, jumped: midIdx }, ...ns]);
          }
        }
      }
    }
    return sequences;
  } else {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const r0 = rowOf(startIdx);
    const c0 = colOf(startIdx);

    for (const [dr,dc] of dirs) {
      let rr = r0;
      let cc = c0;
      while (true) {
        rr += dr; cc += dc;
        if (!inBoard(rr,cc)) break;
        const idx = (rr-1)*8 + (cc-1);
        if (board[idx] === null) continue;
        if (board[idx].player === opponent(player)) {
          // check for landing squares after this jumped piece
          let rr2 = rr;
          let cc2 = cc;
          let anyLanding = false;
          while (true) {
            rr2 += dr; cc2 += dc;
            if (!inBoard(rr2,cc2)) break;
            const landing = (rr2-1)*8 + (cc2-1);
            if (board[landing] === null) anyLanding = true;
            else break;
          }
          if (anyLanding) {
            rr2 = rr;
            cc2 = cc;
            while (true) {
              rr2 += dr; cc2 += dc;
              if (!inBoard(rr2,cc2)) break;
              const landing = (rr2-1)*8 + (cc2-1);
              if (board[landing] !== null) break;
              const boardCopy = cloneBoard(board);
              boardCopy[landing] = { ...boardCopy[startIdx] };
              boardCopy[startIdx] = null;
              boardCopy[(rr-1)*8 + (cc-1)] = null;
              const nextSeqs = generateCapturesFrom(boardCopy, landing, boardCopy[landing].isKing, player, settings);
              if (nextSeqs.length === 0) sequences.push([{ to: landing, jumped: (rr-1)*8 + (cc-1) }]);
              else {
                for (const ns of nextSeqs) sequences.push([{ to: landing, jumped: (rr-1)*8 + (cc-1) }, ...ns]);
              }
            }
          }
          break; // only first opponent in this dir can be jumped
        } else {
          break; // own piece blocks
        }
      }
    }
    return sequences;
  }
}

export function applyMoveOnBoard(board, from, move) {
  const b = cloneBoard(board);
  const piece = b[from];
  if (!piece) return { board, captured: 0, promoted: false };
  let captured = 0;
  let promoted = false;

  if (move.type === "move") {
    const to = move.to;
    b[to] = { ...b[from] };
    b[from] = null;
    const rank = rowOf(to);
    if (!b[to].isKing) {
      if ((b[to].player === "A" && rank === 8) || (b[to].player === "B" && rank === 1)) {
        b[to].isKing = true; promoted = true;
      }
    }
  } else if (move.type === "capture") {
    let curIdx = from;
    for (const step of move.seq) {
      const to = step.to;
      const jumped = step.jumped;
      b[to] = { ...b[curIdx] };
      b[curIdx] = null;
      // remove jumped piece (should exist)
      b[jumped] = null;
      captured += 1;
      curIdx = to;
      const rank = rowOf(curIdx);
      if (!b[curIdx].isKing) {
        if ((b[curIdx].player === "A" && rank === 8) || (b[curIdx].player === "B" && rank === 1)) {
          b[curIdx].isKing = true;
          promoted = true;
          break;
        }
      }
    }
  }
  return { board: b, captured, promoted };
}

export function isGameOverCheck(board, playerToMove) {
  let piecesA = 0, piecesB = 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p) continue;
    if (p.player === "A") piecesA++;
    else piecesB++;
  }
  if (piecesA === 0) return { isOver: true, winner: "B", message: "Oyuncu B kazandı (A'nın taşı kalmadı)" };
  if (piecesB === 0) return { isOver: true, winner: "A", message: "Oyuncu A kazandı (B'nin taşı kalmadı)" };

  const caps = generateAllCapturesForPlayer(board, playerToMove, {});
  const moves = generateAllMovesForPlayer(board, playerToMove);
  if (caps.length === 0 && moves.length === 0) {
    return { isOver: true, winner: opponent(playerToMove), message: `Oyuncu ${opponent(playerToMove)} kazandı (blokaj)` };
  }

  return { isOver: false, winner: null, message: "Devam" };
}
