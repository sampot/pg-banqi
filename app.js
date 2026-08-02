import { BanqiAudio } from "./audio.js";
import { BanqiGame, W, H, COLS, ROWS } from "./game.js";
import { cellMetrics, drawBoard, drawLegend, drawTable } from "./sprites.js";

const audio = new BanqiAudio();
const game = new BanqiGame();
globalThis.__banqi = game;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const sideEl = document.getElementById("side");
const remainEl = document.getElementById("remain");
const btnMute = document.getElementById("btn-mute");
const btnReset = document.getElementById("btn-reset");

canvas.width = W;
canvas.height = H;

let running = true;
/** @type {ReturnType<typeof setTimeout> | null} */
let aiTimer = null;

function setStatus(msg, tone = "") {
  statusEl.textContent = msg;
  statusEl.dataset.tone = tone;
}

function syncHud() {
  if (!game.playerSide) {
    sideEl.textContent = "—";
    remainEl.textContent = "32";
  } else {
    sideEl.textContent = game.playerSide === "red" ? "紅" : "黑";
    const yours = game.board.filter((p) => p && p.side === game.playerSide).length;
    const theirs = game.board.filter((p) => p && p.side === game.aiSide).length;
    remainEl.textContent = `${yours}/${theirs}`;
  }
  setStatus(game.message, game.status === "win" ? "win" : game.status === "lose" ? "lose" : "");
}

function draw() {
  drawTable(ctx, W, H);
  drawBoard(ctx, W, H, game.board, game.selected, game.highlights());
  drawLegend(ctx, W, H, game);
}

function handleEvents(events) {
  for (const e of events) {
    if (e === "flip" || e === "deal") audio.flip();
    else if (e === "select") audio.select();
    else if (e === "move") audio.move();
    else if (e === "capture") audio.capture();
    else if (e === "deny") audio.deny();
    else if (e === "win") audio.win();
    else if (e === "lose") audio.lose();
  }
}

function scheduleAi() {
  if (aiTimer) clearTimeout(aiTimer);
  if (game.status !== "playing") return;
  if (!game.playerSide || game.turn !== game.aiSide) return;
  game.aiThinking = true;
  syncHud();
  draw();
  aiTimer = setTimeout(() => {
    const { events } = game.aiMove();
    game.aiThinking = false;
    handleEvents(events);
    syncHud();
    draw();
    // If AI somehow still to move (shouldn't), chain
    if (game.status === "playing" && game.turn === game.aiSide) scheduleAi();
  }, 420 + Math.random() * 280);
}

function pointerToCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * W;
  const y = ((clientY - rect.top) / rect.height) * H;
  const { cellW, cellH, ox, oy, boardW, boardH } = cellMetrics(W, H);
  if (x < ox || y < oy || x >= ox + boardW || y >= oy + boardH) return null;
  const c = Math.floor((x - ox) / cellW);
  const r = Math.floor((y - oy) / cellH);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return { r, c };
}

canvas.addEventListener("pointerdown", async (e) => {
  await audio.unlock();
  if (game.aiThinking || !game.isPlayerTurn()) return;
  const cell = pointerToCell(e.clientX, e.clientY);
  if (!cell) return;
  const { events, ok } = game.click(cell.r, cell.c);
  handleEvents(events);
  syncHud();
  draw();
  if (ok && game.turn === game.aiSide && game.status === "playing") {
    scheduleAi();
  }
});

btnReset.addEventListener("click", async () => {
  await audio.unlock();
  if (aiTimer) clearTimeout(aiTimer);
  game.aiThinking = false;
  game.resetAll();
  syncHud();
  draw();
});

btnMute.addEventListener("click", async () => {
  await audio.unlock();
  audio.setEnabled(!audio.enabled);
  btnMute.textContent = audio.enabled ? "音效開" : "音效關";
  btnMute.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
});

document.body.addEventListener(
  "pointerdown",
  () => {
    void audio.unlock();
  },
  { once: true },
);

function frame() {
  if (!running) return;
  draw();
  requestAnimationFrame(frame);
}

syncHud();
requestAnimationFrame(frame);
