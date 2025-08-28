import React from "react";
import Board from "./components/Board";

export default function App() {
  return (
    <div className="container">
      <Board />
      <footer style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        Kurallar: Zorunlu yeme, en çok yediren tercih edilir. Terfi: arka sıra. (Tam kurallar uygulandı.)
      </footer>
    </div>
  );
}
