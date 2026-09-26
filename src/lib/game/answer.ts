/**
 * Tiny safe math-expression evaluator for the player's own answers ("notes").
 * Accepts: 12, -3,5, 3/2, 2√3, sqrt(2), 2^10, π, 2pi, (1+√5)/2, 30°, 62,5% (= 0.625).
 * Never uses eval.
 */

const TOKEN_REGEX = /\s*(\d+(?:[.,]\d+)?|√|sqrt|pi|π|[-+*/^()×·:°%])/gy;

type Token = string;

function tokenize(input: string): Token[] | null {
  const src = input.trim().toLowerCase().replace(/−/g, "-");
  const out: Token[] = [];
  TOKEN_REGEX.lastIndex = 0;
  let pos = 0;
  while (pos < src.length) {
    TOKEN_REGEX.lastIndex = pos;
    const m = TOKEN_REGEX.exec(src);
    if (!m || m.index !== pos) {
      if (/\s/.test(src[pos])) {
        pos++;
        continue;
      }
      return null;
    }
    out.push(m[1]);
    pos = TOKEN_REGEX.lastIndex;
  }
  return out;
}

class Parser {
  private i = 0;
  constructor(private readonly t: Token[]) {}

  parse(): number | null {
    const v = this.expr();
    if (this.i !== this.t.length) return null;
    return v;
  }

  private peek() {
    return this.t[this.i];
  }

  private expr(): number {
    let v = this.term();
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.t[this.i++];
      const r = this.term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  private term(): number {
    let v = this.unary();
    for (;;) {
      const p = this.peek();
      if (p === "*" || p === "×" || p === "·") {
        this.i++;
        v *= this.unary();
      } else if (p === "/" || p === ":") {
        this.i++;
        v /= this.unary();
      } else if (
        p !== undefined &&
        (p === "(" || p === "√" || p === "sqrt" || p === "pi" || p === "π" || /^\d/.test(p))
      ) {
        // implicit multiplication: 2√3, 2pi, 3(1+x)
        v *= this.unary();
      } else return v;
    }
  }

  private unary(): number {
    if (this.peek() === "-") {
      this.i++;
      return -this.unary();
    }
    if (this.peek() === "+") {
      this.i++;
      return this.unary();
    }
    return this.power();
  }

  private power(): number {
    const base = this.atom();
    if (this.peek() === "^") {
      this.i++;
      return base ** this.unary();
    }
    return base;
  }

  private atom(): number {
    const p = this.t[this.i++];
    if (p === undefined) throw new Error("eof");
    let v: number;
    if (/^\d/.test(p)) v = Number(p.replace(",", "."));
    else if (p === "pi" || p === "π") v = Math.PI;
    else if (p === "√" || p === "sqrt") v = Math.sqrt(this.power());
    else if (p === "(") {
      v = this.expr();
      if (this.t[this.i++] !== ")") throw new Error("paren");
    } else throw new Error(`unexpected ${p}`);
    if (this.peek() === "°") this.i++;
    else if (this.peek() === "%") {
      this.i++;
      v /= 100;
    }
    return v;
  }
}

export function evaluateAnswer(input: string): number | null {
  if (!input.trim()) return null;
  const tokens = tokenize(input);
  if (!tokens) return null;
  try {
    const v = new Parser(tokens).parse();
    return v !== null && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Rounded decimals are fine: 0,17 matches 1/6 and 1,73 matches √3. Percents are forgiving both
 * ways: "45%" also matches a stored 45, and when the key's answer is written as a percent
 * (`answerTex` contains \%), 62,5 and 0,625 both match.
 */
export function isAnswerCorrect(input: string, value: number, answerTex = ""): boolean {
  const v = evaluateAnswer(input);
  if (v === null) return false;
  const candidates = [v];
  if (input.includes("%")) candidates.push(v * 100);
  if (answerTex.includes("%")) candidates.push(v / 100, v * 100);
  const tol = Math.max(0.011, Math.abs(value) * 0.005);
  return candidates.some((c) => Math.abs(c - value) <= tol);
}

export type ChoiceLetter = "A" | "B" | "C" | "D";

/** "c", "C)", " B. " -> the option letter; anything else -> null. */
export function answerLetter(input: string): ChoiceLetter | null {
  const m = /^\s*([a-dA-D])\s*[.)]?\s*$/.exec(input);
  return m ? (m[1].toUpperCase() as ChoiceLetter) : null;
}

/** A note is playable when it is a number, or an option letter on a closed task. */
export function isNoteReadable(note: string, task: { key?: ChoiceLetter }): boolean {
  return evaluateAnswer(note) !== null || (!!task.key && answerLetter(note) !== null);
}

/** Checks a player's note: an option letter against the key, otherwise the number against the value. */
export function checkNote(
  note: string,
  task: { value: number; tex: string; ans?: string; key?: ChoiceLetter },
): boolean {
  const letter = answerLetter(note);
  if (letter && task.key) return letter === task.key;
  return isAnswerCorrect(note, task.value, `${task.tex} ${task.ans ?? ""}`);
}

export function formatValue(v: number): string {
  if (Number.isInteger(v)) return String(v);
  const r = Math.round(v * 100) / 100;
  return String(r);
}
