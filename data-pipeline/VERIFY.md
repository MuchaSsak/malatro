# Second-opinion verification of card values

You re-check annotations another agent already made. The card game hides each task's value; a
player who solves the task correctly must land on **exactly** the stored value. Wrong or ambiguous
values break the game, so be strict. Do NOT edit `annotations/`; you only write a result file.

Paths are relative to `C:\Users\Mucha\Desktop\Malatro\data-pipeline\`.

## Inputs per item (`exam`, `task`)

- Annotation: the entry with `"task": "<task>"` in `annotations/<exam>.json` (fields `value`,
  `answer_kind`, `answer_tex`, `summary_pl`, `category`, `confidence`, `notes`).
- Crop the player sees: `out/<exam>/tasks.json` -> task entry -> `image` (path under `out/`, e.g.
  `out/f2015-P-2026-maj/12.webp`). View it with the Read tool.
- Official key: the task entry's `key` text and the file's `keyHead`. Key text of 2005-2014
  papers is often garbled (minus signs, roots, fractions dropped). When unsure, render the key PDF
  `raw/pdfs/<exam>-key.pdf` (or the exam `raw/pdfs/<exam>.pdf`) pages to PNG with PyMuPDF
  (`page.get_pixmap(dpi=110).save(...)` into your scratch dir) and view them.
- Value rules: `ANNOTATE.md` section on values (read it once): closed tasks = the number in the
  correct option; percents as a plain number (0.25) unless the task asks "o ile procent"; degrees
  stay degrees; `answer_kind: "sum"` = sum of all numbers in the final answer (coordinates of a
  point, all roots, all numeric sub-parts).

## Procedure per item

1. **Crop check.** Does the image contain everything needed to solve it (figure, graph, table,
   data, options)? If something referenced is missing -> verdict `crop_issue`.
2. **Solve it yourself first** from the image, before looking at the stored value. Use Python
   for arithmetic with irrationals.
3. **Compare** with the official key and the stored `value`/`answer_tex`.
4. **Ambiguity test.** Could a correct solver reasonably produce a *different* number? Typical
   traps: several valid solution sets (which one? all?), repeated values (equal sides counted once
   or twice?), which sub-parts count, rounding the key itself does not fix, a count that is trivially
   fixed (sum of triangle angles = 180), "no solutions" stored as 0. If yes -> verdict `exclude`
   with `exclude_reason: "no_numeric"`. Prefer excluding over guessing a convention.
5. Verdict:
   - `ok` - stored value is right and unambiguous.
   - `fix` - value (or answer_tex) is wrong; give the corrected `value` and `answer_tex`.
   - `exclude` - ambiguous or not a single number; give `exclude_reason`.
   - `crop_issue` - crop lacks needed content (say what).
   Also flag `summary_fix` (a corrected short `summary_pl`, max 70 chars, `$...$` for math) only if
   the stored summary misstates the task.

## Output

Write `verify/result-<N>.json` (N = your batch number), a JSON array, one object per item:

```json
{"exam": "...", "task": "12", "verdict": "ok|fix|exclude|crop_issue", "solved_value": 1.5,
 "value": 1.5, "answer_tex": "\\frac{3}{2}", "exclude_reason": null, "summary_fix": null,
 "reason": "max 200 chars: why"}
```

Final reply: counts per verdict and one line per non-`ok` item, max 15 lines.
