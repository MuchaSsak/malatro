"""Merge the full verification pass (VERIFY-FULL.md) into annotations/.

    python data-pipeline/apply_full.py            apply verify/full/result-*.json (+ adj-*.json)
    python data-pipeline/apply_full.py --todo     write verify/full/adjudicate.json and exit

A card is marked `verified` only when an independent solve agrees with the stored value:
  ok        solver == stored value (within tolerance)             -> verified
  fix       solver + key disagree with stored value               -> needs a second agent (adj-*.json)
            that independently lands on the same corrected value -> value replaced, verified
  exclude / crop_issue                                             -> dropped from the pool
Anything else (an ok whose solved value differs, a fix nobody confirmed) stays unverified, and
`build_dataset.py --require-verified` drops it.
"""

import json
import re
import sys
from pathlib import Path

from consistency import tex_to_number

ROOT = Path(__file__).resolve().parent
FULL = ROOT / "verify" / "full"


def load(pattern: str) -> dict[tuple[str, str], dict]:
    out = {}
    for f in sorted(FULL.glob(pattern)):
        raw = f.read_text(encoding="utf-8")
        try:
            items = json.loads(raw)
        except json.JSONDecodeError:
            # agents sometimes leave single backslashes in LaTeX
            items = json.loads(re.sub(r'(?<!\\)\\(?![\\"/bfnrtu])', r"\\\\", raw))
        for r in items:
            out[(r["exam"], str(r["task"]))] = r
    return out


def same(a, b) -> bool:
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        return False
    return abs(a - b) <= max(1e-6, abs(b) * 1e-6)


def needs_adjudication(r: dict, stored) -> bool:
    if r["verdict"] == "fix":
        # a text-only fix (answer_tex wording, value unchanged) needs no second solver
        return not (same(r.get("value"), stored) and same(r.get("solved_value"), stored))
    return r["verdict"] == "ok" and not same(r.get("solved_value"), stored)


def main() -> None:
    results = load("result-*.json")
    adj = load("adj-*.json")
    annotations: dict[str, dict] = {}

    def entry_for(exam: str, task: str) -> dict:
        if exam not in annotations:
            annotations[exam] = json.loads((ROOT / "annotations" / f"{exam}.json").read_text(encoding="utf-8"))
        data = annotations[exam]
        items = data["tasks"] if isinstance(data, dict) else data
        return next(a for a in items if str(a.get("task")) == task)

    if "--todo" in sys.argv:
        todo = []
        for (exam, task), r in results.items():
            stored = entry_for(exam, task).get("value")
            if needs_adjudication(r, stored):
                todo.append({"exam": exam, "task": task, "stored_value": stored, "proposed": r})
        (FULL / "adjudicate.json").write_text(json.dumps(todo, ensure_ascii=False, indent=1), encoding="utf-8")
        print("to adjudicate:", len(todo))
        return

    stats = {"verified": 0, "fixed": 0, "excluded": 0, "crop_issue": 0, "unconfirmed": 0,
             "statement_fix": 0, "topic_fix": 0, "summary_fix": 0}
    for (exam, task), r in results.items():
        a = entry_for(exam, task)
        if not a.get("include"):
            continue
        final = r
        if needs_adjudication(r, a.get("value")):
            second = adj.get((exam, task))
            if not second:
                a["verified"] = False
                stats["unconfirmed"] += 1
                continue
            proposed = r.get("value") if r["verdict"] == "fix" else r.get("solved_value")
            if second["verdict"] in ("exclude", "crop_issue"):
                final = second
            elif not (same(second.get("value"), proposed) or same(second.get("value"), a.get("value"))):
                # the adjudicator landed on a third number: nobody agrees, not safe to ship
                final = {**second, "verdict": "exclude", "exclude_reason": "no_numeric",
                         "reason": f"solvers disagree: {a.get('value')} / {proposed} / {second.get('value')}"}
            else:
                final = second
        verdict = final["verdict"]
        if verdict == "exclude":
            a["include"] = False
            a["exclude_reason"] = final.get("exclude_reason") or "no_numeric"
            a["notes"] = f"{a.get('notes') or ''} [full-verify] {final.get('reason', '')}".strip()
            stats["excluded"] += 1
            continue
        if verdict == "crop_issue":
            a["crop_issue"] = final.get("reason") or "crop lacks needed content"
            stats["crop_issue"] += 1
            continue
        if verdict == "fix" or (verdict == "ok" and not same(a.get("value"), final.get("value"))):
            v = final.get("value")
            tex_v = tex_to_number(final.get("value_tex") or "")
            if not isinstance(v, (int, float)) or (tex_v is not None and not same(tex_v, v)):
                a["verified"] = False
                stats["unconfirmed"] += 1
                continue
            a["value"] = v
            for key in ("answer_tex", "value_tex", "answer_kind"):
                if final.get(key):
                    a[key] = final[key]
            a["notes"] = f"{a.get('notes') or ''} [full-verify fix] {final.get('reason', '')}".strip()
            stats["fixed"] += 1
        # presentation fixes come from the first pass (the adjudicator only re-checks the value)
        if r.get("statement_en_fix"):
            a["statement_en"] = r["statement_en_fix"]
            stats["statement_fix"] += 1
        if r.get("topic_pl_fix"):
            a["topic_pl"] = r["topic_pl_fix"]
            stats["topic_fix"] += 1
        summary = final.get("summary_fix") or r.get("summary_fix")
        if isinstance(summary, dict):
            for lang in ("pl", "en"):
                if summary.get(lang):
                    a[f"summary_{lang}"] = summary[lang]
            stats["summary_fix"] += 1
        if "has_figure" in r:
            a["has_figure"] = bool(r["has_figure"])
        a["verified"] = True
        stats["verified"] += 1

    for exam, data in annotations.items():
        (ROOT / "annotations" / f"{exam}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(stats)


if __name__ == "__main__":
    main()
