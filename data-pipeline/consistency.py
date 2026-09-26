"""Cheap automated cross-checks over every included annotation; flags go to a second-opinion pass.

    python data-pipeline/consistency.py  ->  data-pipeline/verify/flags.json + summary on stdout

Checks (each one is a class of error the verification agents actually found):
  tex_mismatch     answer_tex evaluates to a different number than `value` (mistyped decimals, wrong option)
  value_in_text    a `sum` value that literally appears in the task text (the task states the sum)
  count_vs_value   summary asks "Ile ..." (a count) but answer_tex is a solution like "x=0"
  signed_percent   negative value on a percent-change task ("o ile procent" / "zmalał")
  ratio            answer_tex is a ratio a:b (not a single well-defined number)
  no_diacritics    summary_pl written in ASCII Polish ("trojkat", "rownanie")
"""

import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

ASCII_POLISH = re.compile(
    r"\b(rown\w*|ciag\w*|trojk\w*|wartosc\w*|kat|kata|katow|srod\w*|okreg\w*|wspolcz\w*|sredni\w*|"
    r"najwieksz\w*|najmniejsz\w*|rozwiaz\w*|wysokosc\w*|dlugosc\w*|objetosc\w*|pierwiastk\w*|"
    r"prawdopodobienstw\w*|nierown\w*|przekatn\w*|graniastoslup\w*|ostroslup\w*|stozk\w*|kul[ai]\b|"
    r"liczba\s+rozwiazan|podzieln\w*|wyraz\w*\s+ciagu|iloraz\w*|roznic\w*|sume|sumy)\b",
    re.I,
)
POLISH_CHARS = re.compile(r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]")


def tex_to_number(tex: str) -> float | None:
    """Evaluate simple LaTeX answers: 3, -\\frac{3}{2}, 2\\sqrt{3}, \\sqrt[3]{2}, 5^{3/4}, 72\\pi, 30^\\circ."""
    if not tex:
        return None
    t = tex.strip().strip("$")
    t = re.sub(r"^[a-zA-Z_\\{}\s|]*[=≈]\s*", "", t)  # drop "x =", "|AB| =", "P ="
    if re.search(r"[=,;:]|\\(cup|cap|in|infty|langle|rangle|le|ge|lt|gt)|[<>]|\(|\[.*\]", t):
        return None
    t = t.replace("\\left", "").replace("\\right", "").replace("\\,", "").replace("\\!", "")
    t = t.replace("^\\circ", "").replace("^{\\circ}", "").replace("°", "").replace("\\%", "/100")
    t = t.replace("\\cdot", "*").replace("\\times", "*").replace("{,}", ".")
    t = re.sub(r"(\d),(\d)", r"\1.\2", t)
    for _ in range(6):
        t = re.sub(r"\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", t)
        t = re.sub(r"\\sqrt\[([^\]]*)\]\{([^{}]*)\}", r"((\2)**(1/(\1)))", t)
        t = re.sub(r"\\sqrt\{([^{}]*)\}", r"((\1)**0.5)", t)
        t = re.sub(r"\\sqrt(\d+)", r"((\1)**0.5)", t)
        t = re.sub(r"\^\{([^{}]*)\}", r"**(\1)", t)
    t = t.replace("^", "**").replace("\\pi", "(pi)").replace("π", "(pi)")
    t = t.replace("{", "(").replace("}", ")")
    t = re.sub(r"(\d|\))\s*\(", r"\1*(", t)  # implicit multiplication 2(pi), 2((3)**0.5)
    t = re.sub(r"\)\s*(\d)", r")*\1", t)
    if re.search(r"[a-oq-zA-Z\\]", t.replace("pi", "")):
        return None
    try:
        v = eval(t, {"__builtins__": {}}, {"pi": math.pi})  # noqa: S307 - sanitized arithmetic only
        return float(v) if isinstance(v, (int, float)) and math.isfinite(v) else None
    except Exception:
        return None


def main() -> None:
    flags = []
    for f in sorted((ROOT / "annotations").glob("*.json")):
        exam = f.stem
        data = json.loads(f.read_text(encoding="utf-8"))
        items = data["tasks"] if isinstance(data, dict) else data
        src = json.loads((ROOT / "out" / exam / "tasks.json").read_text(encoding="utf-8"))
        text_by_task = {str(t["task"]): (t.get("stem", "") + "\n" + t.get("text", "")) for t in src["tasks"]}
        for a in items:
            if not a.get("include"):
                continue
            task = str(a.get("task"))
            v = a.get("value")
            tex = a.get("answer_tex") or ""
            summ = a.get("summary_pl") or ""
            kind = a.get("answer_kind")
            why = []
            if kind != "sum":
                tv = tex_to_number(tex)
                if tv is not None and isinstance(v, (int, float)):
                    if abs(tv - v) > max(1e-6, abs(v) * 1e-6):
                        why.append(f"tex_mismatch tex={tv:.10g} value={v:.10g}")
            if kind == "sum" and isinstance(v, (int, float)) and float(v).is_integer() and abs(v) >= 10:
                body = text_by_task.get(task, "")
                if re.search(rf"(?<![\d,.]){int(v)}(?![\d,.])", body):
                    why.append(f"value_in_text {int(v)}")
            if re.match(r"\s*Ile\b", summ) and re.match(r"\s*[a-z]\s*=", tex):
                why.append("count_vs_value")
            body = text_by_task.get(task, "").lower()
            if isinstance(v, (int, float)) and v < 0 and re.search(r"o ile procent|procent|%", body + summ.lower()):
                why.append("signed_percent")
            if re.search(r"\d\s*:\s*\d", tex) and "\\" not in tex.split(":")[0][-2:]:
                why.append("ratio")
            if not POLISH_CHARS.search(summ) and ASCII_POLISH.search(summ):
                why.append("no_diacritics")
            if why:
                flags.append({"exam": exam, "task": task, "why": why, "value": v, "answer_tex": tex, "summary_pl": summ})
    (ROOT / "verify").mkdir(exist_ok=True)
    (ROOT / "verify" / "flags.json").write_text(json.dumps(flags, ensure_ascii=False, indent=1), encoding="utf-8")
    from collections import Counter

    print(len(flags), "flagged", Counter(w.split()[0] for f in flags for w in f["why"]))


if __name__ == "__main__":
    main()
