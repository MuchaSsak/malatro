"""Closed-task options A-D for the answer picker (`opts` in tasks.json).

The English statement lists every option (checked in the full verification pass). An option list is
shipped only when all four options evaluate to a number and exactly one of them equals the card's
verified value, so the picker can never offer a different "correct" answer than the key.
"""

from __future__ import annotations

import math
import re

from consistency import tex_to_number

OPTIONS_RE = re.compile(
    r"(?:^|\s|\()A[.)]\s*(.+?)\s+\(?B[.)]\s*(.+?)\s+\(?C[.)]\s*(.+?)\s+\(?D[.)]\s*(.+?)\s*$", re.S
)
UNIT_RE = re.compile(r"\s*(?:\\(?:text|mathrm)\{[^{}]*\}|cm\^?\{?[23]?\}?|dm\^?\{?[23]?\}?|km|mm|m\^?\{?[23]?\}?|PLN|zł|zl|kg|g|l|s|h)\.?$")


def _plain_to_tex(o: str) -> str:
    """sqrt(17)/9 -> \\sqrt{17}/9 (translations sometimes use plain notation)."""
    for _ in range(3):
        o = re.sub(r"sqrt\(([^()]*)\)", r"\\sqrt{\1}", o)
    return o


def _log(o: str) -> float | None:
    m = re.fullmatch(r"\\log_\{?([0-9.]+)\}?\s*\{?([0-9.]+)\}?", o)
    if m:
        base, arg = float(m.group(1)), float(m.group(2))
        if base > 0 and base != 1 and arg > 0:
            return math.log(arg) / math.log(base)
    return None


def option_value(raw: str, is_sum: bool) -> tuple[str, float, bool] | None:
    """(display tex, number, is_percent) for one option, or None if it is not a plain number."""
    o = raw.strip().rstrip(".;,").strip()
    o = re.sub(r"^\$(.*)\$$", r"\1", o).strip()
    o = _plain_to_tex(o)
    is_percent = o.endswith("%") or o.endswith("\\%")
    core = re.sub(r"\\?%$", "", o).strip()
    core = UNIT_RE.sub("", core).strip()
    v = _log(core)
    if v is None and is_sum:
        # a point (x, y): sum rule of the dataset
        m = re.fullmatch(r"\(\s*([^,()]+?)\s*[,;]\s*([^,()]+?)\s*\)", core)
        if m:
            a, b = tex_to_number(m.group(1)), tex_to_number(m.group(2))
            v = a + b if a is not None and b is not None else None
    if v is None:
        v = tex_to_number(core)
    if v is None or not math.isfinite(v):
        return None
    return o.replace("*", r"\cdot "), v, is_percent


def _close(a: float, b: float) -> bool:
    return abs(a - b) <= max(1e-9, abs(b) * 1e-6)


def extract_options(statement: str | None, value: float, is_sum: bool) -> list[list[str]] | None:
    """[[display tex, answer to type], x4] or None."""
    m = OPTIONS_RE.search(statement or "")
    if not m:
        return None
    parsed = [option_value(g, is_sum) for g in m.groups()]
    if any(p is None for p in parsed):
        return None
    hits = [
        i for i, (_, v, pct) in enumerate(parsed) if _close(v, value) or (pct and (_close(v / 100, value)))
    ]
    if len(hits) != 1:
        return None
    # the game accepts answers within a tolerance (answer.ts isAnswerCorrect): no wrong option may pass
    tol = max(0.011, abs(value) * 0.005)
    for i, (_, v, pct) in enumerate(parsed):
        if i != hits[0] and any(abs(c - value) <= tol for c in ([v, v / 100, v * 100] if pct else [v])):
            return None
    out = []
    for tex, v, pct in parsed:
        answer = f"{v:g}%" if pct else (str(int(v)) if float(v).is_integer() else f"{v:.10g}")
        out.append([tex, answer])
    return out
