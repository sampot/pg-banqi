/**
 * Dark chess (暗棋 / Banqi). Original UI — classic rules for play, not a commercial clone.
 */

export const COLS = 8;
export const ROWS = 4;
export const W = 480;
export const H = 640;

/** Higher = stronger. Cannon is special. */
export const RANK = {
  general: 6,
  advisor: 5,
  elephant: 4,
  chariot: 3,
  horse: 2,
  cannon: 1,
  soldier: 0,
};

/**
 * @typedef {'red'|'black'} Side
 * @typedef {'general'|'advisor'|'elephant'|'chariot'|'horse'|'cannon'|'soldier'} Kind
 * @typedef {{ side: Side, kind: Kind, faceUp: boolean }} Piece
 * @typedef {{ r: number, c: number }} Pos
 */

const RED_LABEL = {
  general: "帥",
  advisor: "仕",
  elephant: "相",
  chariot: "俥",
  horse: "傌",
  cannon: "炮",
  soldier: "兵",
};

const BLACK_LABEL = {
  general: "將",
  advisor: "士",
  elephant: "象",
  chariot: "車",
  horse: "馬",
  cannon: "包",
  soldier: "卒",
};

export function pieceLabel(p) {
  return p.side === "red" ? RED_LABEL[p.kind] : BLACK_LABEL[p.kind];
}

function deck() {
  /** @type {Omit<Piece, 'faceUp'>[]} */
  const d = [];
  /** @param {Side} side @param {Kind} kind @param {number} n */
  const add = (side, kind, n) => {
    for (let i = 0; i < n; i++) d.push({ side, kind });
  };
  for (const side of /** @type {Side[]} */ (["red", "black"])) {
    add(side, "general", 1);
    add(side, "advisor", 2);
    add(side, "elephant", 2);
    add(side, "chariot", 2);
    add(side, "horse", 2);
    add(side, "cannon", 2);
    add(side, "soldier", 5);
  }
  return d;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {Kind} a attacker
 * @param {Kind} b defender
 */
export function canCapture(a, b) {
  if (a === "cannon") return true; // path checked separately
  if (a === "soldier" && b === "general") return true;
  if (a === "general" && b === "soldier") return false;
  return RANK[a] >= RANK[b];
}

export class BanqiGame {
  constructor() {
    this.resetAll();
  }

  resetAll() {
    /** @type {(Piece|null)[]} */
    this.board = shuffle(deck()).map((p) => ({ ...p, faceUp: false }));
    /** @type {Side|null} */
    this.playerSide = null;
    /** @type {Side} */
    this.turn = "red"; // unused until sides assigned; first flip assigns
    this.status = "playing"; // playing | win | lose
    /** @type {Pos|null} */
    this.selected = null;
    this.message = "翻開任一暗子，決定你的陣營";
    this.history = [];
    this.aiThinking = false;
  }

  idx(r, c) {
    return r * COLS + c;
  }

  isInside(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  at(r, c) {
    if (!this.isInside(r, c)) return null;
    return this.board[this.idx(r, c)];
  }

  setAt(r, c, p) {
    this.board[this.idx(r, c)] = p;
  }

  get aiSide() {
    if (!this.playerSide) return null;
    return this.playerSide === "red" ? "black" : "red";
  }

  isPlayerTurn() {
    if (this.status !== "playing") return false;
    if (!this.playerSide) return true; // first flip
    return this.turn === this.playerSide && !this.aiThinking;
  }

  /**
   * @param {number} r
   * @param {number} c
   * @returns {{ events: string[], ok: boolean }}
   */
  click(r, c) {
    /** @type {string[]} */
    const events = [];
    if (!this.isPlayerTurn()) return { events, ok: false };

    const piece = this.at(r, c);

    // First move / flip facedown
    if (!this.playerSide) {
      if (!piece || piece.faceUp) return { events, ok: false };
      piece.faceUp = true;
      this.playerSide = piece.side;
      this.turn = this.aiSide;
      this.selected = null;
      this.message = `你是${this.playerSide === "red" ? "紅" : "黑"}方 · 輪到電腦`;
      events.push("flip", "deal");
      this.checkEnd(events);
      return { events, ok: true };
    }

    // Flip dark piece (ends turn)
    if (piece && !piece.faceUp) {
      piece.faceUp = true;
      this.selected = null;
      this.turn = this.aiSide;
      this.message = `翻開 ${pieceLabel(piece)}`;
      events.push("flip");
      this.checkEnd(events);
      return { events, ok: true };
    }

    // Select own piece
    if (piece && piece.faceUp && piece.side === this.playerSide) {
      if (
        this.selected &&
        this.selected.r === r &&
        this.selected.c === c
      ) {
        this.selected = null;
        return { events, ok: true };
      }
      this.selected = { r, c };
      events.push("select");
      return { events, ok: true };
    }

    // Move / capture with selection
    if (this.selected) {
      const from = this.selected;
      const mover = this.at(from.r, from.c);
      if (!mover) {
        this.selected = null;
        return { events, ok: false };
      }
      if (this.tryMove(from.r, from.c, r, c, events)) {
        this.selected = null;
        this.turn = this.aiSide;
        this.checkEnd(events);
        return { events, ok: true };
      }
      // Click empty invalid / enemy — deselect if not legal
      this.selected = null;
      events.push("deny");
      return { events, ok: false };
    }

    return { events, ok: false };
  }

  /**
   * @param {number} r0
   * @param {number} c0
   * @param {number} r1
   * @param {number} c1
   * @param {string[]} events
   */
  tryMove(r0, c0, r1, c1, events) {
    if (!this.isInside(r0, c0) || !this.isInside(r1, c1)) return false;
    const mover = this.at(r0, c0);
    if (!mover || !mover.faceUp) return false;
    const target = this.at(r1, c1);
    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);

    // Cannon capture: orthogonal, exactly one screen
    if (mover.kind === "cannon" && target && target.faceUp && target.side !== mover.side) {
      if (!this.cannonCanCapture(r0, c0, r1, c1)) return false;
      this.setAt(r1, c1, mover);
      this.setAt(r0, c0, null);
      this.message = `${pieceLabel(mover)} 吃 ${pieceLabel(target)}`;
      events.push("capture");
      return true;
    }

    // Non-cannon: adjacent orthogonal only
    if (dr + dc !== 1) return false;

    if (!target) {
      this.setAt(r1, c1, mover);
      this.setAt(r0, c0, null);
      this.message = `${pieceLabel(mover)} 移動`;
      events.push("move");
      return true;
    }

    if (!target.faceUp) return false; // cannot capture dark by walking
    if (target.side === mover.side) return false;
    if (mover.kind === "cannon") return false; // cannon cannot adjacent-capture
    if (!canCapture(mover.kind, target.kind)) return false;

    this.setAt(r1, c1, mover);
    this.setAt(r0, c0, null);
    this.message = `${pieceLabel(mover)} 吃 ${pieceLabel(target)}`;
    events.push("capture");
    return true;
  }

  cannonCanCapture(r0, c0, r1, c1) {
    if (r0 !== r1 && c0 !== c1) return false;
    let screens = 0;
    if (r0 === r1) {
      const step = c1 > c0 ? 1 : -1;
      for (let c = c0 + step; c !== c1; c += step) {
        if (this.at(r0, c)) screens += 1;
      }
    } else {
      const step = r1 > r0 ? 1 : -1;
      for (let r = r0 + step; r !== r1; r += step) {
        if (this.at(r, c0)) screens += 1;
      }
    }
    return screens === 1;
  }

  /** @returns {{r:number,c:number,r2:number,c2:number,score:number}[]} */
  listMoves(side) {
    /** @type {{r:number,c:number,r2:number,c2:number,score:number}[]} */
    const moves = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = this.at(r, c);
        if (!p || !p.faceUp || p.side !== side) continue;

        // Adjacent
        for (const [dr, dc] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          const r2 = r + dr;
          const c2 = c + dc;
          if (!this.isInside(r2, c2)) continue;
          const t = this.at(r2, c2);
          if (!t) {
            moves.push({ r, c, r2, c2, score: 1 });
          } else if (
            t.faceUp &&
            t.side !== side &&
            p.kind !== "cannon" &&
            canCapture(p.kind, t.kind)
          ) {
            moves.push({ r, c, r2, c2, score: 10 + RANK[t.kind] });
          }
        }

        // Cannon captures
        if (p.kind === "cannon") {
          for (let r2 = 0; r2 < ROWS; r2++) {
            for (let c2 = 0; c2 < COLS; c2++) {
              if (r2 === r && c2 === c) continue;
              const t = this.at(r2, c2);
              if (!t || !t.faceUp || t.side === side) continue;
              if (this.cannonCanCapture(r, c, r2, c2)) {
                moves.push({ r, c, r2, c2, score: 12 + RANK[t.kind] });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  listFlips() {
    /** @type {Pos[]} */
    const flips = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = this.at(r, c);
        if (p && !p.faceUp) flips.push({ r, c });
      }
    }
    return flips;
  }

  /**
   * Simple greedy AI
   * @returns {{ events: string[] }}
   */
  aiMove() {
    /** @type {string[]} */
    const events = [];
    const side = this.aiSide;
    if (!side || this.status !== "playing" || this.turn !== side) {
      return { events };
    }

    const moves = this.listMoves(side).sort((a, b) => b.score - a.score);
    if (moves.length && (moves[0].score >= 10 || Math.random() < 0.55)) {
      const m = moves[0];
      const before = this.at(m.r2, m.c2);
      this.tryMove(m.r, m.c, m.r2, m.c2, events);
      if (!events.length && before) {
        /* tryMove failed */
      }
      if (events.length) {
        this.turn = this.playerSide;
        this.message =
          events.includes("capture")
            ? `電腦 ${this.message}`
            : "電腦移動了一子";
        this.checkEnd(events);
        return { events };
      }
    }

    // Prefer flip
    const flips = this.listFlips();
    if (flips.length) {
      const f = flips[Math.floor(Math.random() * flips.length)];
      const p = this.at(f.r, f.c);
      if (p) {
        p.faceUp = true;
        events.push("flip");
        this.message = `電腦翻開 ${pieceLabel(p)}`;
        this.turn = this.playerSide;
        this.checkEnd(events);
        return { events };
      }
    }

    // Any remaining move
    for (const m of moves) {
      this.tryMove(m.r, m.c, m.r2, m.c2, events);
      if (!events.length) continue;
      this.turn = this.playerSide;
      this.message = "電腦移動了一子";
      this.checkEnd(events);
      return { events };
    }

    // No moves — lose for AI
    this.status = "win";
    this.message = "電腦無棋可走，你贏了";
    events.push("win");
    return { events };
  }

  /** @param {string[]} events */
  checkEnd(events) {
    if (!this.playerSide || !this.aiSide) return;
    const count = (side) =>
      this.board.filter((p) => p && p.side === side).length;
    const pc = count(this.playerSide);
    const ac = count(this.aiSide);
    if (ac === 0) {
      this.status = "win";
      this.message = "吃光對方，你贏了！";
      events.push("win");
    } else if (pc === 0) {
      this.status = "lose";
      this.message = "棋子被吃光，你輸了";
      events.push("lose");
    }
  }

  /** Legal highlight targets for selected piece */
  highlights() {
    /** @type {Pos[]} */
    const out = [];
    if (!this.selected || !this.playerSide) return out;
    const { r, c } = this.selected;
    const p = this.at(r, c);
    if (!p) return out;
    for (const m of this.listMoves(this.playerSide)) {
      if (m.r === r && m.c === c) out.push({ r: m.r2, c: m.c2 });
    }
    return out;
  }
}
