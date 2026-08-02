/**
 * Polished circular pieces for 暗棋對弈.
 */

import { COLS, ROWS, pieceLabel } from "./game.js";

export const BOARD_PAD = 24;
export const BOARD_TOP = 120;

/**
 * @param {number} W
 * @param {number} H
 */
export function cellMetrics(W, H) {
  const boardW = W - BOARD_PAD * 2;
  const boardH = Math.min(280, H * 0.42);
  const cellW = boardW / COLS;
  const cellH = boardH / ROWS;
  return { boardW, boardH, cellW, cellH, ox: BOARD_PAD, oy: BOARD_TOP };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 */
export function drawTable(ctx, W, H) {
  const felt = ctx.createLinearGradient(0, 0, 0, H);
  felt.addColorStop(0, "#14532d");
  felt.addColorStop(0.5, "#166534");
  felt.addColorStop(1, "#052e16");
  ctx.fillStyle = felt;
  ctx.fillRect(0, 0, W, H);

  // Wood frame vibe
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 10;
  roundRect(ctx, 10, 10, W - 20, H - 20, 16);
  ctx.stroke();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  roundRect(ctx, 18, 18, W - 36, H - 36, 12);
  ctx.stroke();

  ctx.fillStyle = "rgba(254,243,199,0.9)";
  ctx.font = "700 18px 'Songti TC', 'Iowan Old Style', serif";
  ctx.textAlign = "center";
  ctx.fillText("暗棋對弈", W / 2, 48);
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(254,243,199,0.65)";
  ctx.fillText("翻子 · 吃子 · 人機對戰", W / 2, 72);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {(import('./game.js').Piece|null)[]} board
 * @param {{r:number,c:number}|null} selected
 * @param {{r:number,c:number}[]} highlights
 */
export function drawBoard(ctx, W, H, board, selected, highlights) {
  const { cellW, cellH, ox, oy, boardW, boardH } = cellMetrics(W, H);

  // Board plate
  const plate = ctx.createLinearGradient(ox, oy, ox, oy + boardH);
  plate.addColorStop(0, "#3f6212");
  plate.addColorStop(1, "#365314");
  ctx.fillStyle = plate;
  roundRect(ctx, ox - 6, oy - 6, boardW + 12, boardH + 12, 10);
  ctx.fill();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ox + c * cellW;
      const y = oy + r * cellH;
      ctx.fillStyle = (r + c) % 2 === 0 ? "#4d7c0f" : "#3f6212";
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = "rgba(254,243,199,0.12)";
      ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
    }
  }

  // Highlights
  for (const h of highlights) {
    const x = ox + h.c * cellW + cellW / 2;
    const y = oy + h.r * cellH + cellH / 2;
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, Math.min(cellW, cellH) * 0.36, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (selected) {
    const x = ox + selected.c * cellW + cellW / 2;
    const y = oy + selected.r * cellH + cellH / 2;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, Math.min(cellW, cellH) * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r * COLS + c];
      if (!p) continue;
      const x = ox + c * cellW + cellW / 2;
      const y = oy + r * cellH + cellH / 2;
      const rad = Math.min(cellW, cellH) * 0.38;
      drawPiece(ctx, x, y, rad, p);
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} rad
 * @param {import('./game.js').Piece} p
 */
export function drawPiece(ctx, x, y, rad, p) {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 1.5, y + 2.5, rad * 0.95, rad * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!p.faceUp) {
    const back = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 2, x, y, rad);
    back.addColorStop(0, "#a16207");
    back.addColorStop(0.55, "#78350f");
    back.addColorStop(1, "#451a03");
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pattern
    ctx.strokeStyle = "rgba(253,224,71,0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(254,243,199,0.55)";
    ctx.font = `700 ${Math.floor(rad * 0.7)}px 'Songti TC', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("暗", x, y + 1);
    return;
  }

  const isRed = p.side === "red";
  const face = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.35, 2, x, y, rad);
  if (isRed) {
    face.addColorStop(0, "#fecaca");
    face.addColorStop(0.45, "#ef4444");
    face.addColorStop(1, "#991b1b");
  } else {
    face.addColorStop(0, "#e5e5e5");
    face.addColorStop(0.45, "#404040");
    face.addColorStop(1, "#171717");
  }
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isRed ? "#fef08a" : "#d4d4d8";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, rad * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isRed ? "#fff7ed" : "#fafafa";
  ctx.font = `700 ${Math.floor(rad * 0.95)}px 'Songti TC', 'PingFang TC', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pieceLabel(p), x, y + 1);
}

/**
 * Captured / remaining legend
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {import('./game.js').BanqiGame} game
 */
export function drawLegend(ctx, W, H, game) {
  const y0 = BOARD_TOP + cellMetrics(W, H).boardH + 36;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(ctx, 24, y0, W - 48, 100, 12);
  ctx.fill();

  ctx.fillStyle = "#fef3c7";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  const you = game.playerSide
    ? game.playerSide === "red"
      ? "你：紅方"
      : "你：黑方"
    : "你：尚未決定";
  const turn =
    game.status !== "playing"
      ? game.status === "win"
        ? "勝負已分"
        : "勝負已分"
      : !game.playerSide
        ? "請翻子"
        : game.turn === game.playerSide
          ? "輪到你"
          : "電腦思考中…";
  ctx.fillText(you, 40, y0 + 28);
  ctx.fillText(turn, 40, y0 + 52);

  const count = (side) =>
    game.board.filter((p) => p && p.side === side).length;
  if (game.playerSide) {
    ctx.fillText(
      `剩餘  你 ${count(game.playerSide)} · 電腦 ${count(game.aiSide)}`,
      40,
      y0 + 76,
    );
  } else {
    ctx.fillText("點暗子開始；再點己方明子移動／吃子", 40, y0 + 76);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
