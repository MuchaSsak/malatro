# Adjudication (second independent solve)

Two sources disagree about a card's value: the stored annotation and a verification agent. You
decide. A wrong card makes a correct player score 0, so **if you are not certain, exclude**.
Do NOT edit `annotations/`; you only write a result file.

Paths are relative to `C:\Users\Mucha\Desktop\Malatro\data-pipeline\`. Read `VERIFY-FULL.md`
once for inputs (crop image, key, key PDF) and value rules.

## Your items

`verify/full/adj-batches.json` element `[N]`: each item has `exam`, `task`, `stored_value` and
`proposed` (the verification agent's result, with its `value`, `solved_value`, `key_value`,
`reason`).

## Procedure per item

1. View the crop and **solve the task completely yourself before reading `stored_value` and
   `proposed`**. Use Python for arithmetic.
2. Read the official key (open the key PDF if the text is garbled; match option content, not
   letters).
3. Only now compare your result with `stored_value` and `proposed.value`.
   - you agree with one of them and with the key -> verdict `ok` (if it is the stored value) or
     `fix` (if it is the proposed one); `value` = that number.
   - you land on a third number, or cannot reach certainty -> `exclude`.
   - the task is ambiguous (several defensible answers) -> `exclude`.
   - the crop lacks needed content -> `crop_issue`.

## Output

`verify/full/adj-<N>.json` - JSON array, one object per item, valid JSON (LaTeX backslashes as
`\\`; check it with `python -c "import json;json.load(open(...,encoding='utf-8'))"`):

```json
{"exam": "...", "task": "12", "verdict": "ok|fix|exclude|crop_issue", "solved_value": 1.5,
 "value": 1.5, "answer_tex": "...", "value_tex": "...", "answer_kind": "single|sum",
 "exclude_reason": null, "summary_fix": null, "reason": "max 200 chars"}
```

Final reply: counts per verdict, one line per item. Max 20 lines.
