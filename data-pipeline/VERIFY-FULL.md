# Full verification pass (every shipped card)

The card game hides each task's value. A player must type an answer, and a wrong stored value
scores a correct player 0 - so **one wrong card breaks the game's promise**. You independently
re-check cards another agent annotated. Be strict. When in doubt, exclude: losing a card costs
nothing, a wrong card costs trust. Do NOT edit `annotations/`; you only write a result file.

Paths are relative to `C:\Users\Mucha\Desktop\Malatro\data-pipeline\`.

## Inputs

- Your batch: `verify/full/batches.json` -> element `[N]` (list of `{exam, task}`).
- Annotation: entry with `"task": "<task>"` in `annotations/<exam>.json` (`value`, `answer_kind`,
  `answer_tex`, `value_tex`, `summary_pl`, `summary_en`, `topic_pl`, `statement_en`, `notes`).
- The crop the player sees: `out/<exam>/tasks.json` -> task entry -> `image` (path under `out/`).
  **Always view it** with the Read tool. `stem` holds shared intro text; the crop may be stitched
  from a shared "Informacja do zadań" block + the task.
- Official key: task entry `key` + file `keyHead`. 2005-2014 key text is often garbled. When the
  key text is unclear, open `raw/pdfs/<exam>-key.pdf` with the Read tool (`pages: "2-4"`). Keys
  may list "Wersja I / II" or "A / B" columns: never trust a letter alone, match the option content.
- Value rules (from `ANNOTATE.md`):
  - single number -> that number; closed ABCD -> numeric value of the correct option;
  - several numbers asked (all roots, point coordinates, parts a)+b)) -> `answer_kind: "sum"`,
    value = sum of all numbers in the final answer; the summary must say what is summed;
  - percents: `0.25` unless the task asks "o ile procent" (then `25`); the game accepts both forms
    for percent answers, so only the magnitude matters;
  - degrees stay degrees; radians -> numeric.

## Procedure per card

1. **Crop check.** Everything needed to solve it visible (figure, graph, table, options, data from
   a shared intro)? If not -> `crop_issue`.
2. **Solve it yourself first**, from the image, before reading `value`. Use Python for arithmetic
   (`python -c ...`). Do the whole solution, not a sanity glance.
3. **Compare** your result with the official key and the stored `value` / `answer_tex`.
   - all three agree -> `ok`
   - stored value wrong but you and the key agree -> `fix`
   - you disagree with the key -> re-solve carefully and re-read the key PDF. If you still cannot
     make them agree with certainty -> `exclude` (`exclude_reason: "no_numeric"`, explain).
4. **Ambiguity test.** Could a careful solver who read only the card summary + the task produce a
   *different* number and still be right? Traps: several valid solution sets, which sub-parts are
   summed, repeated roots (counted once or twice), a double root, rounding the task does not fix,
   "no solutions" stored as 0, answer in a unit the task does not fix, the summary not saying what
   is summed. If the summary alone fixes the ambiguity, give `summary_fix`; otherwise `exclude`.
   Also `exclude` when the stored value can be typed **without solving**: it is stated in the task
   or summary (e.g. the task gives x+y=8 and the value is the sum x+y).
5. **English statement.** Read `statement_en`. It must be a faithful, complete translation: same
   numbers, same question, same options (for closed tasks, all options A-D with their content). If
   it is wrong or incomplete give the full corrected `statement_en_fix` (KaTeX in `$...$`).
6. **Figure flag.** `has_figure: true` if solving needs anything visual from the sheet (drawing,
   graph, table, diagram, chart, grid, coordinate picture). English players see `statement_en`
   plus the original crop only when this is true.
7. **Topic.** If `topic_pl` is Polish written without diacritics ("Ciag geometryczny",
   "Rownanie kwadratowe") give `topic_pl_fix` with correct diacritics. Words that have no
   diacritics (e.g. "Funkcja liniowa") are fine: no fix.

## Output

Write `verify/full/result-<N>.json` - a JSON array, one object per card in your batch, in order.
Write valid JSON: escape LaTeX backslashes as `\\`. Check it with
`python -c "import json;json.load(open(r'verify/full/result-<N>.json',encoding='utf-8'))"`.

```json
{"exam": "...", "task": "12", "verdict": "ok|fix|exclude|crop_issue",
 "solved_value": 1.5, "key_value": 1.5,
 "value": 1.5, "answer_tex": "\\frac{3}{2}", "value_tex": "\\frac{3}{2}", "answer_kind": "single",
 "exclude_reason": null, "summary_fix": null, "statement_en_fix": null, "topic_pl_fix": null,
 "has_figure": false, "reason": "max 200 chars: how you checked / why"}
```

- `value`, `answer_tex`, `value_tex`, `answer_kind`: the values that should be shipped (= stored
  ones for `ok`, corrected ones for `fix`, stored ones for `exclude`/`crop_issue`).
- `summary_fix`: corrected `{"pl": "...", "en": "..."}` (each <= 70 chars, math in `$...$`, never
  revealing the answer), if the summary misstates the task, must say what is summed / what number
  to type (closed tasks whose correct option is an equation: say which number is asked), **or
  `summary_pl` is Polish written without diacritics** ("zl", "rosnaca" -> "zł", "rosnąca").

Final reply: counts per verdict, count of statement/figure/topic fixes, and one line per non-`ok`
verdict. Max 20 lines.
