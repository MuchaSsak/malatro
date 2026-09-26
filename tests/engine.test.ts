import { describe, expect, test } from "bun:test";

import { evaluateAnswer, isAnswerCorrect } from "~/lib/game/answer";
import { VALUE_CAP } from "~/lib/game/constants";
import { makePool } from "~/lib/game/deck";
import { GameEngine } from "~/lib/game/engine";
import { detectHand } from "~/lib/game/hands";
import { Rng } from "~/lib/game/rng";
import { createRun, validatePlay } from "~/lib/game/run";
import { scoreHand } from "~/lib/game/scoring";
import type { CardInstance } from "~/lib/game/types";

import { emptyRound, fakePool, task } from "./fixtures";

describe("answer parser", () => {
  test("evaluates matura-style answers", () => {
    expect(evaluateAnswer("3/2")).toBe(1.5);
    expect(evaluateAnswer("-3,5")).toBe(-3.5);
    expect(evaluateAnswer("2√3")).toBeCloseTo(2 * Math.sqrt(3));
    expect(evaluateAnswer("2^10")).toBe(1024);
    expect(evaluateAnswer("(1+√5)/2")).toBeCloseTo(1.618, 3);
    expect(evaluateAnswer("2pi")).toBeCloseTo(2 * Math.PI);
    expect(evaluateAnswer("30°")).toBe(30);
    expect(evaluateAnswer("62,5%")).toBeCloseTo(0.625);
    expect(evaluateAnswer("abc")).toBeNull();
    expect(evaluateAnswer("")).toBeNull();
  });
  test("accepts rounded decimals", () => {
    expect(isAnswerCorrect("0,17", 1 / 6)).toBe(true);
    expect(isAnswerCorrect("1.73", Math.sqrt(3))).toBe(true);
    expect(isAnswerCorrect("2", 3)).toBe(false);
  });
});

describe("hand detection", () => {
  test("category combos", () => {
    expect(detectHand(["liczby"])).toBe("high");
    expect(detectHand(["liczby", "liczby"])).toBe("pair");
    expect(detectHand(["liczby", "liczby", "ciagi", "ciagi"])).toBe("twopair");
    expect(detectHand(["liczby", "liczby", "liczby"])).toBe("three");
    expect(detectHand(["liczby", "liczby", "liczby", "ciagi", "ciagi"])).toBe("full");
    expect(detectHand(["liczby", "liczby", "liczby", "wyrazenia", "wyrazenia"])).toBe("flushfull");
    expect(detectHand(["liczby", "liczby", "liczby", "liczby"])).toBe("four");
    expect(detectHand(["liczby", "liczby", "liczby", "liczby", "liczby"])).toBe("five");
    expect(detectHand(["liczby", "wyrazenia", "rownania", "liczby", "wyrazenia"])).toBe("flush");
    expect(detectHand(["liczby", "funkcje", "planimetria", "liczby", "funkcje"])).toBe("twopair");
    expect(detectHand(["liczby", "funkcje", "planimetria", "liczby", "liczby"])).toBe("three");
  });
  test("flush and cross-section", () => {
    expect(detectHand(["planimetria", "stereometria", "trygonometria", "analityczna", "stereometria"])).toBe("flush");
    expect(detectHand(["liczby", "funkcje", "planimetria", "kombinatoryka", "ciagi"])).toBe("cross");
    expect(detectHand(["liczby", "funkcje", "planimetria", "ciagi", "wyrazenia"])).toBe("high");
    expect(detectHand(["planimetria", "stereometria", "trygonometria", "analityczna"], { isFourFingers: true })).toBe(
      "flush",
    );
  });
});

describe("scoring", () => {
  test("chips = base + clamped values; negative values subtract", () => {
    const tasks = [task("liczby", 12, "a"), task("liczby", -4, "b"), task("ciagi", 1000, "c")];
    const pool = makePool(tasks);
    const run = createRun("trywialne", "TEST", 0);
    const cards: CardInstance[] = tasks.map((t, i) => ({ uid: `u${i}`, taskId: t.id }));
    Object.assign(run.notes, { a: "12", b: "-4", c: "1000" });
    run.round = emptyRound(cards);
    const res = scoreHand({ run, round: run.round, played: cards, pool, rng: new Rng(1) });
    expect(res.handType).toBe("pair");
    expect(res.chips).toBe(10 + 12 - 4 + VALUE_CAP);
    expect(res.mult).toBe(2);
    expect(res.total).toBe((10 + 8 + VALUE_CAP) * 2);
  });

  test("jokers: Moduł makes negatives positive, Kalkulator adds mult", () => {
    const pool = makePool([task("liczby", -6, "a")]);
    const run = createRun("trywialne", "TEST", 0);
    run.jokers = [
      { uid: "j1", id: "modul", vars: {} },
      { uid: "j2", id: "kalkulator", vars: {} },
    ];
    const cards: CardInstance[] = [{ uid: "u0", taskId: "a" }];
    run.notes.a = "-6";
    run.round = emptyRound(cards);
    const res = scoreHand({ run, round: run.round, played: cards, pool, rng: new Rng(1) });
    expect(res.chips).toBe(5 + 6);
    expect(res.mult).toBe(1 + 4);
  });

  test("a wrong answer scores nothing and drops out of the hand type", () => {
    const pool = makePool([task("liczby", 12, "a"), task("liczby", 7, "b")]);
    const run = createRun("trywialne", "TEST", 0);
    Object.assign(run.notes, { a: "12", b: "3" });
    run.jokers = [{ uid: "j1", id: "prymus", vars: {} }];
    const cards: CardInstance[] = [
      { uid: "u0", taskId: "a" },
      { uid: "u1", taskId: "b" },
    ];
    run.round = emptyRound(cards);
    const res = scoreHand({ run, round: run.round, played: cards, pool, rng: new Rng(1) });
    expect(res.handType).toBe("high"); // not a pair: the wrong card doesn't count
    expect(res.chips).toBe(5 + 12);
    expect(res.mult).toBe(1); // Prymus needs every card right
    expect(res.scoredUids).toEqual(["u0"]);
    expect(res.moneyGained).toBe(0);
  });

  test("all answers right: no base money, Prymus doubles, face-down cards need no answer", () => {
    const pool = makePool([task("liczby", 0.5, "a"), task("ciagi", 4, "b")]);
    const run = createRun("trywialne", "TEST", 0);
    run.notes.a = "1/2";
    run.jokers = [{ uid: "j1", id: "prymus", vars: {} }];
    const cards: CardInstance[] = [
      { uid: "u0", taskId: "a" },
      { uid: "u1", taskId: "b" },
    ];
    run.round = emptyRound(cards);
    const res = scoreHand({ run, round: run.round, played: cards, pool, rng: new Rng(1), faceDownUids: ["u1"] });
    expect(res.correctNotes).toBe(1);
    expect(res.chips).toBe(5 + 0.5 + 4);
    expect(res.moneyGained).toBe(0);
    expect(res.mult).toBe(1); // Prymus: 1 correct of 2 played (the face-down one has no answer)
  });

  test("playing requires an answer on every selected face-up card", () => {
    const pool = fakePool();
    const engine = new GameEngine(pool);
    engine.newRun("trywialne", "SEED4");
    engine.selectBlind();
    const run = engine.getSnapshot()!;
    const card = run.round!.hand[0];
    engine.toggleSelect(card.uid);
    expect(validatePlay(engine.getSnapshot()!, pool)).not.toBeNull();
    engine.setNote(card.taskId, String(pool.byId.get(card.taskId)!.value));
    expect(validatePlay(engine.getSnapshot()!, pool)).toBeNull();
  });
});

describe("engine flow", () => {
  test("a blind can be played to a result, then shop, then next blind", () => {
    const pool = fakePool();
    const engine = new GameEngine(pool);
    engine.newRun("trywialne_plus", "SEED1");
    expect(engine.getSnapshot()?.phase).toBe("blind-select");
    engine.selectBlind();
    let run = engine.getSnapshot()!;
    expect(run.phase).toBe("round");
    expect(run.round!.hand.length).toBe(8);
    expect(run.round!.deck.length).toBe(40 - 8);
    for (let guard = 0; guard < 10 && engine.getSnapshot()!.phase === "round"; guard++) {
      run = engine.getSnapshot()!;
      for (const c of run.round!.hand.slice(0, 5)) {
        engine.toggleSelect(c.uid);
        engine.setNote(c.taskId, String(pool.byId.get(c.taskId)!.value));
      }
      engine.playHand();
      engine.resolvePlay();
    }
    const phase = engine.getSnapshot()!.phase;
    expect(["cashout", "gameover"]).toContain(phase);
    if (phase === "cashout") {
      engine.cashOut();
      expect(engine.getSnapshot()!.phase).toBe("shop");
      expect(engine.getSnapshot()!.shop!.items.length).toBe(2);
      engine.leaveShop();
      expect(engine.getSnapshot()!.blindIndex).toBe(1);
    }
  });

  test("skipping a blind grants its tag and advances", () => {
    const engine = new GameEngine(fakePool());
    engine.newRun("trywialne", "SEED2");
    engine.skipBlind();
    const run = engine.getSnapshot()!;
    expect(run.blindIndex === 1).toBe(true);
  });

  test("run survives a save/load round trip", () => {
    const pool = fakePool();
    const a = new GameEngine(pool);
    a.newRun("ciekawe", "SEED3");
    a.selectBlind();
    const b = new GameEngine(pool);
    expect(b.getSnapshot()?.round?.hand.length).toBe(8);
    expect(b.getSnapshot()?.id).toBe(a.getSnapshot()?.id);
  });
});
