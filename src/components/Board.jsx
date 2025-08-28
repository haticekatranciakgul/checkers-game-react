import React from "react";
import { useSelector, useDispatch } from "react-redux";
import Square from "./Square";
import Piece from "./Piece";
import { selectSquare, tryMove, restart } from "../features/gameSlice";
//import { indexToCoord } from "../utils/rules";

export default function Board() {
  const dispatch = useDispatch();
  const board = useSelector(state => state.game.board);
  const current = useSelector(state => state.game.currentPlayer);
  const selected = useSelector(state => state.game.selected);
  const possible = useSelector(state => state.game.possibleMoves);
  const message = useSelector(state => state.game.message);
  const winner = useSelector(state => state.game.winner);

  // helpers to check if a target is among possibleMoves (either simple move or capture seq)
  function isPossibleTarget(idx) {
    for (const p of possible) {
      if (p.type === "move" && p.to === idx) return true;
      if (p.type === "capture") {
        const last = p.seq[p.seq.length - 1];
        if (last && last.to === idx) return true;
      }
    }
    return false;
  }

  function onSquareClick(idx) {
    const piece = board[idx];
    if (piece && piece.player === current) {
      dispatch(selectSquare(idx));
    } else {
      // if selected and idx is among possible targets, build payload and dispatch tryMove
      if (selected === null) return;
      // find matching move
      const move = possible.find(p => {
        if (p.type === "move") return p.to === idx;
        if (p.type === "capture") {
          const last = p.seq[p.seq.length - 1];
          return last && last.to === idx;
        }
        return false;
      });
      if (!move) return;
      // create payload: include from, and either type move or capture seq
      if (move.type === "move") {
        dispatch(tryMove({ from: selected, type: "move", to: move.to }));
      } else {
        dispatch(tryMove({ from: selected, type: "capture", seq: move.seq }));
      }
    }
  }

  // Board rendering: display ranks 8..1 top->down to match typical board picture.
  const rows = [];
  for (let r = 8; r >= 1; r--) {
    const cols = [];
    for (let c = 1; c <= 8; c++) {
      const idx = (r - 1) * 8 + (c - 1);
      const piece = board[idx];
      const isSelected = selected === idx;
      const highlight = isPossibleTarget(idx);
      cols.push(
        <Square
          key={idx}
          idx={idx}
          isSelected={isSelected}
          highlight={highlight}
          onClick={() => onSquareClick(idx)}
          file={String.fromCharCode("a".charCodeAt(0) + c - 1)}
          rank={r}
        >
          {piece && <Piece player={piece.player} isKing={piece.isKing} />}
        </Square>
      );
    }
    rows.push(
      <div className="board-row" key={r}>
        {cols}
      </div>
    );
  }

  return (
    <div className="game-area">
      <div className="game-header">
        <h2>Türk Daması</h2>
        <div className="info">
          <div>Şu an: Oyuncu {current} {winner ? ` - OYUN BİTTİ: ${winner} kazandı` : ""}</div>
          <div className="message">{message}</div>
        </div>
        <div>
          <button onClick={() => dispatch(restart())}>Yeniden Başlat</button>
        </div>
      </div>

      <div className="board">{rows}</div>

      <div className="notation">
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <div>a b c d e f g h</div>
          <div>1 2 3 4 5 6 7 8</div>
        </div>
      </div>
    </div>
  );
}
