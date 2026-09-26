# Annotating matura tasks for Malatro (instructions for annotation agents)

Malatro is a Balatro-like game where every card is a real Polish matura math task. A card's
hidden **chip value is the task's final numeric answer**. You turn extracted tasks into card data.
Accuracy of `value` is the #1 priority — a wrong value silently breaks the game.

## Inputs (per exam id)
- `data-pipeline/out/<id>/tasks.json` → `exam` (metadata), `keyHead` (start of the answer key text),
  `tasks[]` with: `task` ("7" or "14.1"), `points` (max pts), `image` (crop path relative to
  `data-pipeline/out/`), `stem` (shared intro text for subtasks), `text` (raw PDF text of the task),
  `key` (answer-key excerpt for this task).
- Raw text of formula 2005/2015 PDFs is often **garbled** (MathType fonts). ALWAYS look at the task
  image with the Read tool (e.g. `C:\Users\Mucha\Desktop\Malatro\data-pipeline\out\<image>`). For formula
  2023 text is usually clean, but still view the image whenever there is a figure, table, graph, or doubt.
- The official key PDF is `data-pipeline/raw/pdfs/<id>-key.pdf`. When the `key` excerpt is empty,
  garbled or ambiguous, read the relevant key pages with the Read tool (`pages: "3-5"`). Closed-task
  answers are often in a table at the start of the key (`keyHead`). Some keys list "Wersja I / Wersja II"
  or "A / B" columns: letters differ between versions, so **never trust a letter alone — match the
  option's content and verify by solving**.
- Special cases: `f2005-R-2018-czerwiec` key covers only tasks not shared with `f2015-R-2018-czerwiec`
  (use that exam's key for shared tasks: `data-pipeline/raw/pdfs/f2015-R-2018-czerwiec-key.pdf`).

## Decide `include`
Include only when the task's requested final answer is a **finite set of real numbers**:
- a single number (length, area, probability, count, parameter value, angle in degrees, term of a
  sequence, x-coordinate, limit value, derivative value, …) → `answer_kind: "single"`;
- several numbers (all solutions of an equation, coordinates (x, y), a) + b) parts each giving a
  number, several parameter values, dimensions x and y) → `answer_kind: "sum"`, value = **sum of all
  the numbers in the final answer** (e.g. solutions −3 and 2 → −1; point (3, −2) → 1).
- multi-part task mixing symbolic parts and numeric parts (a) "Wyznacz wzór" + b) "Oblicz a₂₀₀₇" +
  c) "Wyznacz n") → `sum` of the **numeric parts only**; the summary must say which parts are summed,
  e.g. `(b + c)`. If no part is numeric → exclude.
- closed ABCD task whose correct option is a number or numeric expression (5, −2, 2√3, 1/6, log₂5,
  sin 30°, 3·10⁻²) → value = numeric value of the correct option (`single`).
Exclude (`include: false`) and set `exclude_reason`:
`proof` (Wykaż/Udowodnij) · `true_false` (P/F) · `matching` (przyporządkuj, fill table with letters) ·
`multi_choice_letters` (choose 2 of A–F etc. unless every chosen option is a plain number → then sum,
include) · `interval_or_set` (answer is an interval, union, inequality solution set, infinite set,
"x ∈ …") · `expression` (formula, equation of a line/circle/function, polynomial, symbolic answer,
"8ab") · `graph_or_drawing` (pick a graph, draw, sketch) · `statement` (which sentence is true) ·
`no_numeric` (anything else without a numeric final answer) · `unreadable` (crop broken — explain in
`notes`).

## Value rules
- `value`: a JS number, full precision (e.g. `1.7320508075688772` for √3, `0.16666666666666666`).
- `value_tex`: exact form in LaTeX without `$` (`\sqrt{3}`, `\frac{1}{6}`, `-\frac{5}{2}`, `24\sqrt{3}`).
  For `sum` give the sum's exact form.
- `answer_tex`: the full final answer as the key states it (`x=-3 \lor x=2`, `A=(3,-2)`, `r=-2`).
- Units: use the unit the task asks for; degrees stay degrees (30° → 30); percents as the number of
  percent if the question asks "o ile procent" (25% → 25) — otherwise the numeric value (0.25).
- Radians → numeric (π/3 → 1.0471975511965976).
- **Verify**: solve the task yourself (at least a quick check). If your result disagrees with the key,
  re-read the key PDF; the key wins unless it is clearly a transcription problem — then set
  `confidence: "low"` and explain in `notes`.

## Classify
- `category` (exactly one): `liczby` (arithmetic, powers, roots, logarithm values, percents, absolute
  value of numbers, divisibility, approximations) · `wyrazenia` (algebraic expressions, polynomials,
  rational expressions, remainders, formulas) · `rownania` (equations/inequalities of any algebraic,
  exponential, logarithmic or absolute-value kind, systems of equations) · `funkcje` (function
  properties, graphs, linear/quadratic/exponential/log functions, max/min of quadratic without calculus,
  parameters in functions) · `ciagi` (sequences, sums, geometric series, sequence limits) · `analiza`
  (function limits, derivatives, tangent lines, monotonicity via derivative, optimisation with
  derivatives) · `trygonometria` (trig values, identities, trig equations, trig ratios in right
  triangles) · `planimetria` (plane geometry) · `analityczna` (coordinate geometry, lines, circles in
  the plane, vectors, distances) · `stereometria` (solids) · `kombinatoryka` (counting) ·
  `prawdopodobienstwo` (probability, conditional, Bernoulli) · `statystyka` (mean, median, mode,
  variance, standard deviation, reading data).
- `topic_pl` / `topic_en`: 1–4 word subtopic, e.g. "Logarytmy" / "Logarithms", "Ciąg geometryczny" /
  "Geometric sequence", "Graniastosłup" / "Prism".
- `difficulty` 1–5 on ONE scale across all matura levels: 1 = trivial one-step basic-level task;
  2 = standard basic-level closed/short task; 3 = harder basic-level (long open, 4–5 pts) or easy
  extended-level; 4 = typical extended-level; 5 = hardest extended-level (long parameter/optimisation
  tasks, 6–7 pts, multi-step).

## Card text
- `summary_pl`: ≤ 70 visible characters, recognisable at a glance, **never reveals the answer**.
  Inline math only as `$...$` KaTeX. Examples: `Oblicz $\log_{\sqrt3}9$` · `Ciąg arytm.: $a_3=-1$,
  $S_{15}=-165$. Oblicz $r$` · `Pole trójkąta o bokach $5, 12, 13$` · `Ile liczb 4-cyfrowych o różnych
  cyfrach?` · `Rozwiąż $x^3-2x^2-3x+6=0$ (suma rozwiązań)`. For `sum` tasks end with a short hint of
  what is summed: `(suma rozwiązań)`, `(x + y)`, `(suma współrzędnych)`, `(a + b)`.
- `summary_en`: accurate English equivalent (same length rules; for sum: `(sum of solutions)` etc.).
- `statement_en`: a faithful, complete English translation of the WHOLE task (stem + question +
  options A–D with their contents; describe figures/tables briefly in brackets, e.g. "[Figure: parabola
  with vertex (1, 9) …]"). Markdown with `$...$` math. Only for included tasks.
- Use correct English math terminology: ciąg arytmetyczny/geometryczny = arithmetic/geometric
  sequence; różnica/iloraz = common difference/ratio; wyraz = term; dziedzina = domain; zbiór wartości
  = range; miejsce zerowe = zero; wierzchołek paraboli = vertex of the parabola; oś symetrii = axis of
  symmetry; styczna = tangent (line); pochodna = derivative; granica = limit; graniastosłup (prawidłowy)
  = (regular) prism; ostrosłup = pyramid; prostopadłościan = cuboid; stożek = cone; walec = cylinder;
  kula = ball/sphere; tworząca = slant height; przekątna = diagonal; wysokość = height/altitude;
  okrąg = circle; koło = disc; cięciwa = chord; kąt wpisany/środkowy = inscribed/central angle;
  trapez równoramienny = isosceles trapezoid; romb = rhombus; równoległobok = parallelogram;
  wartość bezwzględna = absolute value; nierówność = inequality; układ równań = system of equations;
  wielomian = polynomial; reszta z dzielenia = remainder; średnia arytmetyczna = arithmetic mean;
  mediana = median; dominanta = mode; odchylenie standardowe = standard deviation; zdarzenie = event;
  zdarzenie przeciwne = complementary event; losowanie ze zwracaniem = drawing with replacement;
  "Wybierz właściwą odpowiedź spośród podanych" = "Choose the correct answer from the options given";
  "Zapisz obliczenia" = "Show your working"; "kartezjański układ współrzędnych" = "Cartesian coordinate
  system".
- Polish text must use proper diacritics. Use an ASCII hyphen `-`, never en/em dashes, in all text
  fields except inside LaTeX.

## Output
Write `data-pipeline/annotations/<id>.json` (UTF-8, valid JSON) for each exam in your batch:
```json
{
  "exam": "<id>",
  "tasks": [
    {
      "task": "14.1", "include": true, "exclude_reason": null,
      "answer_kind": "single", "value": 2.5, "value_tex": "\\frac{5}{2}", "answer_tex": "x=\\frac{5}{2}",
      "category": "funkcje", "topic_pl": "Funkcja kwadratowa", "topic_en": "Quadratic function",
      "difficulty": 2,
      "summary_pl": "...", "summary_en": "...", "statement_en": "...",
      "confidence": "high", "notes": ""
    },
    { "task": "3", "include": false, "exclude_reason": "proof", "category": "liczby", "difficulty": 2, "notes": "" }
  ]
}
```
One entry per task in `tasks.json`, same order. `confidence`: `high` (key clear + your solve agrees),
`medium` (minor doubt, e.g. key excerpt garbled but content matched), `low` (disagreement or unclear).
If a crop is broken (cut off, wrong task, blank), still annotate from the key/PDF if you can, and add
`"crop_issue": "<what is wrong>"`. You may open the exam PDF itself
(`data-pipeline/raw/pdfs/<id>.pdf`) with the Read tool `pages` parameter when the crop is insufficient.

Work exam by exam and **write each exam's file as soon as it is done** (don't hold everything to the
end). Finish with a short report: per exam, counts of included/excluded/low-confidence and any crop
problems.
