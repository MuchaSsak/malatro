"""Crop matura tasks out of CKE exam PDFs.

For every exam in manifest.json:
  - find task headers ("Zadanie 7. (0-2)", "Zadanie 14.1. (0-1)", "Zadanie 14.", "Informacja do zadań 10-12")
  - split pages into segments between headers, cut at "Brudnopis", examiner tables, footer
  - raster-detect the real content bottom (light solving grid is ignored)
  - stitch stem + subtask segments into one webp per task
  - dump raw task text + the matching answer-key text for annotation

Usage: python extract.py [exam_id ...]
"""

from __future__ import annotations

import io
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).parent
RAW = ROOT / "raw" / "pdfs"
OUT = ROOT / "out"
ZOOM = 2.0
X0, X1 = 58.0, 537.0  # crop columns (pt); score boxes live outside
DARK = 150  # grayscale threshold for "content" pixels (grid lines are lighter)

HEADER_RE = re.compile(
    r"^Zadanie\s+(\d{1,2})(?:\.(\d{1,2}))?\.?\s*(?:\(\s*(?:0\s*[–\-−]\s*)?(?:\d\s*[–\-−]\s*)*(\d{1,2})\s*(?:pkt|p\.)?\s*\))?"
)
# Shared intro blocks stitched above every task they cover:
#   "Informacja do zadań 8.–10." / "Informacja do zadań 10. i 11." (2015+ papers)
#   "W zadaniach 8. i 9. wykorzystaj przedstawiony poniżej wykres" (2005 papers)
# but not the instruction lines "W zadaniach od 1. do 25. wybierz ..." / "W zadaniach 1-25 wybierz ...".
INFO_RE = re.compile(
    r"^(?:Informacja\s+do\s+zada[ńn]|W\s+zadaniach)\s+(\d{1,2})(?:\.\d+)?\.?\s*(?:[–\-−]|i)\s*(\d{1,2})\.?"
    r"(?!.*(?:wybierz|zaznacz|zakoduj))"
)
STOP_RE = re.compile(
    r"^(Brudnopis|BRUDNOPIS|Wypełnia|WYPEŁNIA|Nr zadania|Maks|Odpowied[źz]\s*:|Odpowied[źz]\s*\.{3})"
)
COVER_RE = re.compile(r"^(MATEMATYKA|Poziom (podstawowy|rozszerzony)|Formuła 20|BRUDNOPIS\s*$)")
NOISE_RE = re.compile(r"(arkusze\.pl|Strona\s+\d+\s+z\s+\d+|^[EM]MA[PR]-|^MMA|^EMA|Więcej arkuszy)")


@dataclass
class Header:
    page: int
    y: float
    num: int
    sub: int | None
    points: int | None
    kind: str  # "task" | "stem" | "info"
    info_range: tuple[int, int] | None = None


@dataclass
class Task:
    key: str
    num: int
    sub: int | None
    points: int | None
    segments: list[tuple[int, float, float]] = field(default_factory=list)
    stem_segments: list[tuple[int, float, float]] = field(default_factory=list)
    text: str = ""
    stem_text: str = ""


def line_text(line: dict) -> str:
    return "".join(s["text"] for s in line["spans"]).strip()


def page_lines(page: pymupdf.Page) -> list[tuple[float, float, str, dict]]:
    out = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            t = line_text(l)
            if t:
                out.append((l["bbox"][1], l["bbox"][0], t, l))
    out.sort(key=lambda r: (round(r[0]), r[1]))
    return out


def is_bold(line: dict) -> bool:
    f = line["spans"][0]["font"].lower()
    return "bold" in f or "-bd" in f or "black" in f or bool(line["spans"][0]["flags"] & 16)


def page_bounds(page: pymupdf.Page, lines) -> tuple[float, float]:
    h = page.rect.height
    top, bottom = 40.0, h - 50.0
    for y, x, t, _ in lines:
        if NOISE_RE.search(t):
            if y > h * 0.85:
                bottom = min(bottom, y - 6)
            elif y < h * 0.1:
                top = max(top, y + 14)
    return top, bottom


def find_headers(doc: pymupdf.Document) -> tuple[list[Header], dict[int, list]]:
    headers: list[Header] = []
    all_lines = {}
    started = False
    for pi in range(doc.page_count):
        page = doc[pi]
        lines = page_lines(page)
        all_lines[pi] = lines
        for y, x, t, l in lines:
            if x > 140:
                continue
            m = HEADER_RE.match(t)
            if m and is_bold(l):
                num, sub, pts = int(m.group(1)), m.group(2), m.group(3)
                started = True
                sub_i = int(sub) if sub else None
                rest = t[m.end():].strip()
                kind = "task" if (pts or sub_i or rest == "" or rest.startswith("(")) else "task"
                headers.append(Header(pi, y, num, sub_i, int(pts) if pts else None, kind))
                continue
            mi = INFO_RE.match(t)
            if mi and is_bold(l):
                started = True
                headers.append(Header(pi, y, int(mi.group(1)), None, None, "info", (int(mi.group(1)), int(mi.group(2)))))
    # a numbered header followed by its own ".1" sub-header is a stem
    for i, h in enumerate(headers):
        if h.kind == "task" and h.sub is None:
            nxt = next((g for g in headers[i + 1 :] if g.kind != "info"), None)
            if nxt and nxt.num == h.num and nxt.sub is not None:
                h.kind = "stem"
    return headers, all_lines


def stops_on_page(lines, y_from: float, y_to: float) -> float | None:
    for y, x, t, _ in lines:
        if y_from < y < y_to and STOP_RE.match(t):
            return y
    return None


def segments_between(doc, all_lines, start: Header, end: Header | None) -> list[tuple[int, float, float]]:
    segs = []
    last_page = end.page if end else doc.page_count - 1
    for pi in range(start.page, last_page + 1):
        page = doc[pi]
        lines = all_lines[pi]
        top, bottom = page_bounds(page, lines)
        y0 = start.y - 4 if pi == start.page else top
        y1 = (end.y - 6) if (end and pi == end.page) else bottom
        if y1 <= y0 + 8:
            continue
        if pi > start.page:
            body = [
                t for y, x, t, l in lines
                if y0 <= y <= y1 and not NOISE_RE.search(t) and l["spans"][0]["size"] < 14 and not STOP_RE.match(t)
            ]
            if not body or any(COVER_RE.match(t) for y, x, t, _ in lines):
                break
        stop = stops_on_page(lines, y0 + 10, y1)
        if stop is not None:
            y1 = stop - 12
        if y1 > y0 + 8:
            segs.append((pi, y0, y1))
    return segs


def page_xrange(page: pymupdf.Page) -> tuple[float, float]:
    x0s, x1s = [], []
    for y, x, t, l in page_lines(page):
        if l["spans"][0]["size"] >= 9.5 and l["bbox"][0] > 25 and not NOISE_RE.search(t):
            x0s.append(l["bbox"][0])
            x1s.append(l["bbox"][2])
    if len(x0s) < 3:
        return X0, X1
    x0s.sort()
    lo = x0s[max(0, int(len(x0s) * 0.02) - 1)] - 10
    hi = max(x1s) + 8
    return max(28.0, min(lo, 80.0)), min(page.rect.width - 20, max(hi, 520.0))


def render_segment(doc, seg) -> Image.Image | None:
    pi, y0, y1 = seg
    page = doc[pi]
    xa, xb = page_xrange(page)
    clip = pymupdf.Rect(xa, y0, xb, y1)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=clip, colorspace=pymupdf.csGRAY, alpha=False)
    img = Image.frombytes("L", (pix.width, pix.height), pix.samples)
    # content rows = rows with enough dark pixels
    w, h = img.size
    px = img.load()
    rows = []
    step = 2
    for yy in range(h):
        dark = 0
        for xx in range(0, w, step):
            if px[xx, yy] < DARK:
                dark += 1
                if dark > 2:
                    break
        rows.append(dark > 2)
    if not any(rows):
        return None
    first = rows.index(True)
    last = h - 1 - rows[::-1].index(True)
    pad = int(8 * ZOOM)
    return img.crop((0, max(0, first - pad), w, min(h, last + pad)))


def stitch(images: list[Image.Image]) -> Image.Image:
    gap = int(10 * ZOOM)
    w = max(i.width for i in images)
    h = sum(i.height for i in images) + gap * (len(images) - 1)
    out = Image.new("L", (w, h), 255)
    y = 0
    for i, im in enumerate(images):
        out.paste(im, (0, y))
        y += im.height
        if i < len(images) - 1:
            # thin dashed separator between stitched parts
            for xx in range(0, w, 12):
                for dx in range(6):
                    if xx + dx < w:
                        out.putpixel((xx + dx, y + gap // 2), 200)
            y += gap
    return out


def segment_text(doc, all_lines, segs) -> str:
    parts = []
    for pi, y0, y1 in segs:
        for y, x, t, _ in all_lines[pi]:
            if y0 - 1 <= y <= y1 and 25 <= x <= 570 and not NOISE_RE.search(t):
                parts.append(t)
    return "\n".join(parts)


def build_tasks(doc, headers, all_lines) -> list[Task]:
    tasks: list[Task] = []
    stems: dict[int, list] = {}
    stem_texts: dict[int, str] = {}
    info_for: dict[int, tuple[list, str]] = {}
    for i, h in enumerate(headers):
        nxt = headers[i + 1] if i + 1 < len(headers) else None
        segs = segments_between(doc, all_lines, h, nxt)
        txt = segment_text(doc, all_lines, segs)
        if h.kind == "info" and h.info_range:
            for n in range(h.info_range[0], h.info_range[1] + 1):
                info_for[n] = (segs, txt)
            continue
        if h.kind == "stem":
            stems[h.num] = segs
            stem_texts[h.num] = txt
            continue
        key = f"{h.num}" if h.sub is None else f"{h.num}.{h.sub}"
        t = Task(key, h.num, h.sub, h.points, segs)
        t.text = txt
        stem_segs = []
        stem_txt = []
        if h.num in info_for:
            stem_segs += info_for[h.num][0]
            stem_txt.append(info_for[h.num][1])
        if h.sub is not None and h.num in stems:
            stem_segs += stems[h.num]
            stem_txt.append(stem_texts[h.num])
        t.stem_segments = stem_segs
        t.stem_text = "\n".join(stem_txt)
        tasks.append(t)
    # dedupe (answer sheets sometimes repeat headers)
    seen = set()
    uniq = []
    for t in tasks:
        if t.key in seen:
            continue
        seen.add(t.key)
        uniq.append(t)
    return uniq


KEY_HEADER_RE = re.compile(r"^Zadanie\s+(\d{1,2})(?:\.(\d{1,2}))?\.?(?:\s|\(|$)")


def split_key(key_path: Path) -> dict[str, str]:
    """Split answer-key text into per-task chunks keyed "7" / "14.1"."""
    if not key_path.exists():
        return {}
    doc = pymupdf.open(key_path)
    lines = []
    for p in doc:
        for y, x, t, l in page_lines(p):
            if NOISE_RE.search(t):
                continue
            lines.append(t)
    chunks: dict[str, list[str]] = {}
    cur = None
    for t in lines:
        m = KEY_HEADER_RE.match(t)
        if m:
            cur = m.group(1) if not m.group(2) else f"{m.group(1)}.{m.group(2)}"
            chunks.setdefault(cur, [])
        if cur:
            chunks[cur].append(t)
    out = {}
    for k, v in chunks.items():
        s = "\n".join(v)
        out[k] = s[:6000]
    # closed-task answer tables ("Zadanie 1 2 3 ... / Odpowiedź A C ...") are kept raw for the annotator
    head = "\n".join(lines[:400])
    out["_head"] = head[:8000]
    return out


def process(exam: dict) -> dict | None:
    exam_id = exam["id"]
    pdf = RAW / f"{exam_id}.pdf"
    if not pdf.exists():
        return None
    doc = pymupdf.open(pdf)
    headers, all_lines = find_headers(doc)
    tasks = build_tasks(doc, headers, all_lines)
    key = split_key(RAW / f"{exam_id}-key.pdf")
    out_dir = OUT / exam_id
    out_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for t in tasks:
        imgs = [im for im in (render_segment(doc, s) for s in t.stem_segments + t.segments) if im is not None]
        if not imgs:
            continue
        img = stitch(imgs)
        fname = f"{t.key.replace('.', '_')}.webp"
        img.save(out_dir / fname, "WEBP", quality=72, method=6)
        records.append(
            {
                "task": t.key,
                "num": t.num,
                "sub": t.sub,
                "points": t.points,
                "image": f"{exam_id}/{fname}",
                "size": [img.width, img.height],
                "stem": t.stem_text[:3000],
                "text": t.text[:4000],
                "key": key.get(t.key) or key.get(str(t.num)) or "",
            }
        )
    result = {"exam": exam, "keyHead": key.get("_head", ""), "tasks": records}
    (out_dir / "tasks.json").write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    return result


def run_one(exam: dict) -> str:
    try:
        r = process(exam)
        return f"{exam['id']}: {len(r['tasks'])} tasks" if r else f"{exam['id']}: missing pdf"
    except Exception as e:  # keep going on odd layouts
        return f"{exam['id']}: ERROR {e}"


def main():
    from concurrent.futures import ProcessPoolExecutor

    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    only = set(sys.argv[1:])
    todo = [
        e
        for e in manifest
        if (not only or e["id"] in only) and e.get("ok", True) and not e.get("duplicateOf")
    ]
    with ProcessPoolExecutor(max_workers=6) as pool:
        for line in pool.map(run_one, todo):
            print(line, flush=True)


if __name__ == "__main__":
    main()
