import React from "react";

export default function Square({ children, onClick, isSelected, highlight, file, rank }) {
  // checkerboard style but full board used: use alternating background (light/dark) for visual
  const r = rank;
  const c = file.charCodeAt(0) - "a".charCodeAt(0) + 1;
  const isDark = (r + c) % 2 === 0;
  let className = "square " + (isDark ? "dark" : "light");
  if (isSelected) className += " selected";
  if (highlight) className += " highlight";
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}
