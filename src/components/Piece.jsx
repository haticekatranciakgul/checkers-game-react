import React from "react";

export default function Piece({ player, isKing }) {
  return (
    <div className={"piece " + (player === "A" ? "white" : "black")}>
      {isKing && <div className="crown">♔</div>}
    </div>
  );
}
