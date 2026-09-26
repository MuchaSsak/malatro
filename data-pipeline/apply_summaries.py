"""Merge verify/summ-out-*.json (diacritics / English re-sync pass) into annotations/.

    python data-pipeline/apply_summaries.py

LaTeX spans must be unchanged, otherwise the entry is skipped and reported.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MATH = re.compile(r"\$[^$]*\$")


def main() -> None:
    changed = skipped = 0
    for out in sorted((ROOT / "verify").glob("summ-out-*.json")):
        for item in json.loads(out.read_text(encoding="utf-8")):
            path = ROOT / "annotations" / f"{item['exam']}.json"
            data = json.loads(path.read_text(encoding="utf-8"))
            entries = data["tasks"] if isinstance(data, dict) else data
            entry = next(a for a in entries if str(a.get("task")) == str(item["task"]))
            old_pl, new_pl = entry.get("summary_pl") or "", item.get("summary_pl") or ""
            if new_pl and MATH.findall(old_pl) != MATH.findall(new_pl):
                print("skip (LaTeX changed):", item["exam"], item["task"])
                skipped += 1
                continue
            touched = False
            for key in ("summary_pl", "summary_en"):
                if item.get(key) and item[key] != entry.get(key):
                    entry[key] = item[key]
                    touched = True
            if touched:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
                changed += 1
    print(f"summaries updated: {changed}, skipped: {skipped}")


if __name__ == "__main__":
    main()
