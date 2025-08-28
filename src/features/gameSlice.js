import { createSlice } from "@reduxjs/toolkit";
import {
  createInitialBoard,

  generateAllCapturesForPlayer,
  generateAllMovesForPlayer,
  applyMoveOnBoard,
  isGameOverCheck,
} from "../utils/rules.js";

const initialBoard = createInitialBoard();

const initialState = {
  board: initialBoard, // array length 64, null or { player: 'A'|'B', isKing: bool }
  currentPlayer: "A", // Oyuncu A başlasın (üstte gösterilen)
  selected: null, // seçili kare index
  possibleMoves: [], // hedef index'leri ya da capture serileri
  moveHistory: [],
  settings: {
    tieBreak: "mostKings", // "mostKings" | "preferKingStart" | "freeChoice"
    noCaptureLimit: 50,
    allowRevisitSquare: true,
  },
  noCaptureCounter: 0,
  winner: null,
  message: "Oyuncu A başladı",
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    restart(state) {
      state.board = createInitialBoard();
      state.currentPlayer = "A";
      state.selected = null;
      state.possibleMoves = [];
      state.moveHistory = [];
      state.noCaptureCounter = 0;
      state.winner = null;
      state.message = "Oyuncu A başladı";
    },
    selectSquare(state, action) {
      const idx = action.payload;
      if (state.winner) return;
      const piece = state.board[idx];
      if (piece && piece.player === state.currentPlayer) {
        state.selected = idx;
        // calculate available moves / capture sequences for this piece given mandatory-capture logic
        const captures = generateAllCapturesForPlayer(state.board, state.currentPlayer, state.settings);
        if (captures.length > 0) {
          // filtrele: sadece seçilen taşın capture serileri
          const forThis = captures.filter((c) => c.start === idx);
          state.possibleMoves = forThis.map((c) => ({ type: "capture", seq: c.seq }));
        } else {
          // normal moves for this piece
          const moves = generateAllMovesForPlayer(state.board, state.currentPlayer).filter(m => m.start === idx);
          state.possibleMoves = moves.map(m => ({ type: "move", to: m.to }));
        }
      } else {
        // clicked empty veya rakip taşı -> eğer hedef uygunsa hamle yap
        if (state.selected === null) return;
      }
    },
    tryMove(state, action) {
      if (state.winner) return;
      const payload = action.payload; // { from, to } or { from, seq }
      const from = payload.from;
      // determine if move legal by comparing with possibleMoves computed when selection happened
      // recompute capture possibility globally
      const captures = generateAllCapturesForPlayer(state.board, state.currentPlayer, state.settings);
      const globalHasCaptures = captures.length > 0;

      // check if payload is capture seq
      let newBoard = JSON.parse(JSON.stringify(state.board));
      let capturedCount = 0;
      // let promoted = false; // promoted kullanılmıyor, kaldırıldı

      if (payload.type === "capture") {
        // payload.seq: array of { toIndex, jumpedIndex }
        const res = applyMoveOnBoard(newBoard, from, { type: "capture", seq: payload.seq });
        newBoard = res.board;
        capturedCount = res.captured;
        // const { promoted } = res; // promoted kullanılmıyor
      } else if (payload.type === "move") {
        // simple move
        if (globalHasCaptures) {
          state.message = "Yeme varken düz gitme yasak.";
          return;
        }
        const res = applyMoveOnBoard(newBoard, from, { type: "move", to: payload.to });
        newBoard = res.board;
        // const { promoted } = res; // promoted kullanılmıyor
      } else {
        return;
      }

      // update state
      state.board = newBoard;
      state.moveHistory.push({ player: state.currentPlayer, from, payload });
      if (capturedCount > 0) state.noCaptureCounter = 0;
      else state.noCaptureCounter += 1;

      // check game over
      const over = isGameOverCheck(state.board, state.currentPlayer === "A" ? "B" : "A");
      if (over.isOver) {
        state.winner = over.winner;
        state.message = over.message;
        state.selected = null;
        state.possibleMoves = [];
        return;
      }

      // promote handled in applyMoveOnBoard
      // switch player
      state.currentPlayer = state.currentPlayer === "A" ? "B" : "A";
      state.selected = null;
      state.possibleMoves = [];

      // update message
      state.message = `Sıra oyuncu ${state.currentPlayer} de`;
    },
    setSettings(state, action) {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const { restart, selectSquare, tryMove, setSettings } = gameSlice.actions;
export default gameSlice.reducer;
