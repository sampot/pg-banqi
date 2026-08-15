import { describe, expect, it } from "vitest";
import { BanqiGame, COLS, ROWS } from "./game.js";

function emptyBoard() {
  return Array(COLS * ROWS).fill(null);
}

describe("BanqiGame turn handling", () => {
  it("ends the player's turn after the opening flip", () => {
    const game = new BanqiGame();
    game.board = emptyBoard();
    game.setAt(0, 0, { side: "red", kind: "soldier", faceUp: false });
    game.setAt(0, 1, { side: "black", kind: "soldier", faceUp: false });

    expect(game.click(0, 0).ok).toBe(true);
    expect(game.playerSide).toBe("red");
    expect(game.turn).toBe("black");
    expect(game.click(0, 1).ok).toBe(false);
    expect(game.at(0, 1)?.faceUp).toBe(false);
  });
});

describe("BanqiGame board boundaries", () => {
  it("never lists moves outside the board", () => {
    const game = new BanqiGame();
    game.board = emptyBoard();
    game.setAt(0, 0, { side: "black", kind: "chariot", faceUp: true });

    const moves = game.listMoves("black");

    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) {
      expect(move.r2).toBeGreaterThanOrEqual(0);
      expect(move.r2).toBeLessThan(ROWS);
      expect(move.c2).toBeGreaterThanOrEqual(0);
      expect(move.c2).toBeLessThan(COLS);
    }
  });

  it("rejects an out-of-bounds move without removing the piece", () => {
    const game = new BanqiGame();
    const piece = { side: "black", kind: "chariot", faceUp: true };
    game.board = emptyBoard();
    game.setAt(0, 0, piece);

    expect(game.tryMove(0, 0, 0, -1, [])).toBe(false);
    expect(game.at(0, 0)).toBe(piece);
  });
});

describe("BanqiGame AI fallback", () => {
  it("does not hand the turn over when a fallback move fails", () => {
    const game = new BanqiGame();
    const piece = { side: "black", kind: "soldier", faceUp: true };
    game.board = emptyBoard();
    game.playerSide = "red";
    game.turn = "black";
    game.setAt(0, 0, piece);
    game.setAt(3, 7, { side: "red", kind: "soldier", faceUp: true });
    game.listMoves = () => [{ r: 0, c: 0, r2: 0, c2: -1, score: 1 }];
    game.listFlips = () => [];

    const { events } = game.aiMove();

    expect(events).toEqual(["win"]);
    expect(game.status).toBe("win");
    expect(game.turn).toBe("black");
    expect(game.at(0, 0)).toBe(piece);
  });
});
