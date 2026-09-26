"""Merge annotations + crops into the game's static dataset.

Outputs:
  public/data/tasks.json            compact TaskRecord[] (see src/lib/game/types.ts)
  public/data/statements/<exam>.json {task: statement_en} (lazy-loaded English translations)
  public/tasks/<exam>/<task>.webp    task crops (included tasks only)
  data-pipeline/dataset-report.json  counts + validation problems

Usage: python data-pipeline/build_dataset.py [--require-verified]

--require-verified ships only cards marked `verified` by apply_full.py (full re-solve pass).
"""

from __future__ import annotations

import json
import math
import re
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path

from options import extract_options

ROOT = Path(__file__).parent
APP = ROOT.parent
OUT = ROOT / "out"
ANN = ROOT / "annotations"
PUBLIC = APP / "public"
REQUIRE_VERIFIED = "--require-verified" in sys.argv
# closed tasks whose options aren't plain numbers: the correct letter, read by an agent from the
# options against the verified value (id -> "A".."D"); numeric options get their letter below
ANSWER_KEYS = json.loads((ROOT / "answer_keys.json").read_text(encoding="utf-8"))

CATEGORIES = {
    "liczby", "wyrazenia", "rownania", "funkcje", "ciagi", "analiza", "trygonometria",
    "planimetria", "analityczna", "stereometria", "kombinatoryka", "prawdopodobienstwo", "statystyka",
}
DASH_RE = re.compile(r"[–—]")


def opts_answer(value: float, like: str) -> str:
    """The value formatted the way extract_options formats an option answer."""
    v = float(value)
    if like.endswith("%"):
        return f"{v:g}%" if f"{v:g}%" == like else f"{v * 100:g}%"
    return str(int(v)) if v.is_integer() else f"{v:.10g}"


def clean(s: str | None) -> str:
    # house copy rule: ASCII hyphen only (LaTeX inside $...$ untouched since it never uses the dashes)
    return DASH_RE.sub("-", (s or "").strip())


def norm_text(t: str) -> str:
    return re.sub(r"\s+", "", t or "")[:400]


def main():
    manifest = {e["id"]: e for e in json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))}
    records = []
    statements: dict[str, dict[str, str]] = defaultdict(dict)
    problems = []
    seen_text: dict[str, str] = {}
    stats = Counter()

    tasks_dir = PUBLIC / "tasks"
    if tasks_dir.exists():
        shutil.rmtree(tasks_dir)
    (PUBLIC / "data" / "statements").mkdir(parents=True, exist_ok=True)

    for ann_file in sorted(ANN.glob("*.json")):
        try:
            ann = json.loads(ann_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            problems.append({"exam": ann_file.stem, "problem": f"bad json: {e}"})
            continue
        exam_id = ann.get("exam") or ann_file.stem
        src_file = OUT / exam_id / "tasks.json"
        if not src_file.exists():
            problems.append({"exam": exam_id, "problem": "no extracted tasks"})
            continue
        src = json.loads(src_file.read_text(encoding="utf-8"))
        by_task = {t["task"]: t for t in src["tasks"]}
        meta = manifest.get(exam_id, src["exam"])
        for a in ann.get("tasks", []):
            stats["annotated"] += 1
            key = str(a.get("task"))
            t = by_task.get(key)
            if not t:
                problems.append({"exam": exam_id, "task": key, "problem": "task not in extraction"})
                continue
            if not a.get("include"):
                stats[f"excluded:{a.get('exclude_reason') or 'unknown'}"] += 1
                continue
            value = a.get("value")
            cat = a.get("category")
            if not isinstance(value, (int, float)) or not math.isfinite(value):
                problems.append({"exam": exam_id, "task": key, "problem": f"bad value {value!r}"})
                continue
            if cat not in CATEGORIES:
                problems.append({"exam": exam_id, "task": key, "problem": f"bad category {cat!r}"})
                continue
            if not a.get("summary_pl") or not a.get("summary_en"):
                problems.append({"exam": exam_id, "task": key, "problem": "missing summary"})
                continue
            if a.get("crop_issue"):
                # the card image lacks something the task needs (usually a shared figure)
                stats["crop_issue_dropped"] = stats.get("crop_issue_dropped", 0) + 1
                problems.append({"exam": exam_id, "task": key, "problem": "crop issue", "notes": a.get("crop_issue")})
                continue
            if REQUIRE_VERIFIED and not a.get("verified"):
                # full second-opinion pass (VERIFY-FULL.md): only independently re-solved cards ship
                stats["unverified_dropped"] = stats.get("unverified_dropped", 0) + 1
                problems.append({"exam": exam_id, "task": key, "problem": "not verified"})
                continue
            if a.get("confidence") == "low":
                stats["low_confidence_dropped"] += 1
                problems.append({"exam": exam_id, "task": key, "problem": "low confidence", "notes": a.get("notes")})
                continue
            fingerprint = norm_text(t.get("stem", "") + t.get("text", ""))
            if len(fingerprint) > 60 and fingerprint in seen_text:
                stats["duplicates"] += 1
                continue
            seen_text[fingerprint] = f"{exam_id}__{key}"

            img_src = OUT / t["image"]
            img_dst = tasks_dir / t["image"]
            img_dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(img_src, img_dst)

            diff = int(a.get("difficulty") or 2)
            records.append(
                {
                    "id": f"{exam_id}__{key}",
                    "exam": exam_id,
                    "task": key,
                    "level": meta.get("level", "P"),
                    "cat": cat,
                    "topic": {"pl": clean(a.get("topic_pl")), "en": clean(a.get("topic_en"))},
                    "diff": max(1, min(5, diff)),
                    "pts": int(t.get("points") or 1),
                    "value": float(value) if not float(value).is_integer() else int(value),
                    "sum": a.get("answer_kind") == "sum",
                    "tex": a.get("value_tex") or str(value),
                    "ans": a.get("answer_tex") or "",
                    "s": {"pl": clean(a.get("summary_pl")), "en": clean(a.get("summary_en"))},
                    "img": t["image"],
                    "w": t["size"][0],
                    "h": t["size"][1],
                    "year": meta.get("year"),
                    "session": meta.get("session"),
                    "formula": meta.get("formula"),
                    "conf": a.get("confidence", "high"),
                }
            )
            if "has_figure" in a:
                # English sheet: show the original crop under the translation (else the client guesses)
                records[-1]["fig"] = bool(a["has_figure"])
            opts = extract_options(a.get("statement_en"), float(value), a.get("answer_kind") == "sum")
            if opts:
                # closed task: the answer panel offers A-D, each filling in its number
                records[-1]["opts"] = opts
                stats["with_options"] += 1
                hits = [i for i, (_, ans) in enumerate(opts) if ans == opts_answer(value, ans)]
                if len(hits) == 1:
                    records[-1]["key"] = "ABCD"[hits[0]]
            if "key" not in records[-1] and records[-1]["id"] in ANSWER_KEYS:
                records[-1]["key"] = ANSWER_KEYS[records[-1]["id"]]
            if "key" in records[-1]:
                stats["with_key"] += 1
            if a.get("statement_en"):
                statements[exam_id][key] = a["statement_en"].strip()
            stats["included"] += 1

    records.sort(key=lambda r: r["id"])
    (PUBLIC / "data" / "tasks.json").write_text(
        json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    for exam_id, st in statements.items():
        (PUBLIC / "data" / "statements" / f"{exam_id}.json").write_text(
            json.dumps(st, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

    by_level_cat = Counter((r["level"], r["cat"]) for r in records)
    values = sorted(r["value"] for r in records)
    report = {
        "stats": dict(stats),
        "records": len(records),
        "byLevel": dict(Counter(r["level"] for r in records)),
        "byCategory": dict(Counter(r["cat"] for r in records)),
        "byLevelCategory": {f"{k[0]}:{k[1]}": v for k, v in sorted(by_level_cat.items())},
        "byDifficulty": dict(Counter(f"{r['level']}{r['diff']}" for r in records)),
        "valuePercentiles": {p: values[int(len(values) * p / 100)] for p in (1, 5, 10, 25, 50, 75, 90, 95, 99)}
        if values
        else {},
        "negativeShare": round(sum(1 for v in values if v < 0) / max(1, len(values)), 3),
        "problems": problems,
    }
    (ROOT / "dataset-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "problems"}, ensure_ascii=False, indent=1))
    print(f"problems: {len(problems)}")


if __name__ == "__main__":
    main()
