# Local Skill Based Mastery App — Complete Design Specification

## 0 Purpose

Implement adaptive knowledge‑graph pedagogy in a fully offline, single‑learner application. Features: prerequisite‑aware lessons, FSRS with implicit prerequisite credit, non‑interference task ordering, cross‑course remediation, and periodic mixed quizzes. All canonical data are plain JSON/YAML; scheduling parameters are intrinsic and not content‑editable.

## 1 Terminology

### 1.1 Atomic Skill (AS)

The **Atomic Skill (AS)** is the smallest learning unit.

* **Scope** – one bite‑sized skill or concept (e.g., “Solve a quadratic by factoring”).  Each topic lists one or more ASs.
* **Content** – Markdown exposition (`as_md/<as>.md`) plus ≥ 20 MCQ items (`as_questions/<as>.yaml`).
* **ID format** – `<COURSE>:AS<topic>_<index>` (e.g., `ALG1:AS045_2`).
* **Lifecycle** – *unseen* → first attempt; *in\_progress* until FSRS-5 mastery; *mastered* when `n ≥ 3` and last three grades = 5.
* **Practice contexts** – lesson, scheduled reviews, and mixed‑quiz checks all operate at the AS level.

---

## 2 Filesystem Layout

```
app_root/
  courses.json                 # list of installed courses
  course/
    algebra_1/                 # course id = ALG1
      catalog.json             # course metadata & entry topics
      topics/                  # <topic>.json per topic
      as_md/                   # Markdown per AS
      as_questions/            # YAML per AS
    geometry/                  # course id = GEOM1
      …
  save/
    mastery.json               # FSRS-5 state per AS
    attempt_window.json        # recent grades per AS & topic quiz
    xp.json                    # XP transactions
    prefs.json                 # ui prefs, last_as, xp_since_mixed_quiz
  .cache/index.db              # optional SQLite mirror
```

### 2.1 Loader & Cache

* **Demand‑load topics** — when the engine references `ALG1:T045`, load `topics/ALG1:T045.json`; recursively load prerequisites.
* **.cache/index.db** schema:

  * `topic(id TEXT PRIMARY KEY, name TEXT)`
  * `edge(src TEXT, dst TEXT, weight REAL)`
  * `as_count(topic_id TEXT, cnt INT)`
  * `dist(src TEXT, dst TEXT, d INT)` (all‑pairs undirected distance)
* **Rebuild triggers** — if any `topics/*.json` timestamp > last index build or a course folder added/removed.
* **Distance matrix** — computed once at startup with Floyd–Warshall; stored in `dist` table for O(1) lookups.

### 2.2 Global Course Registry (`courses.json`)

```jsonc
{
  "format": "Courses-v1",
  "courses": [
    {"id":"ALG1","name":"Algebra I","path":"course/algebra_1/"},
    {"id":"GEOM1","name":"Geometry","path":"course/geometry/"}
  ]
}
```

### 2.3 Course Metadata (`course/<id>/catalog.json`)

```jsonc
{
  "format":"Catalog-v1",
  "course_id":"ALG1",
  "entry_topics":["ALG1:T001"],
  "description":"Algebra I scope and sequence"
}
```

---

## 3 Course Assets

### 3.1 Topic File (`topics/<id>.json`)

Pure UI metadata—no graph semantics.

```jsonc
{
  "id": "ALG1:T045",
  "name": "Quadratic Formula",
  "ass": ["ALG1:AS045_1", "ALG1:AS045_2"]
}
```

### 3.2 Atomic Skill File (`skills/<id>.json`)

Each Atomic Skill is stored in its **own JSON file** inside the `skills/` directory. Topic files merely reference these IDs; they do **not** embed the AS data.

```jsonc
{
  "id": "ALG1:AS045_2",
  "name": "Apply quadratic formula",
  "prereqs": ["ALG1:AS030_2", "ALG1:AS031_1"],
  "weights": {"ALG1:AS030_2": 0.6}
}
```

`weights` is optional; any missing weight defaults to 1.0.
AS Markdown (`as_md/<as>.md`)
Shown the first time the AS is attempted; accessible later via “Review Explanation.”

### 3.3 AS Question Pool (`as_questions/<as>.yaml`)

YAML list of ≥ 20 MCQ items in fixed order. Question IDs are unique **within** their AS (`ALG1:AS045_2_q17`).

---

## 4 Save Data

### 4.1 `mastery.json`

```jsonc
{
  "format":"Mastery-v2",
  "ass":{
    "ALG1:AS045_2":{
      "status":"in_progress",
      "ef":2.5,
      "n":1,
      "interval":1,
      "next_due":"2025-05-19T10:00:00Z",
      "next_q_index":3
    }
  },
  "topics":{
    "ALG1:T045":{
      "status":"in_progress",
      "last_quiz_score":0.92,
      "last_quiz_date":"2025-05-18T09:50:00Z"
    }
  }
}
```

### 4.2 `attempt_window.json`

```jsonc
{
  "format":"Attempts-v1",
  "ass":{
    "ALG1:AS045_2":[5,5,4,5,5]
  },
  "topics":{
    "ALG1:T045":[0.90,0.95]
  }
}
```

### 4.3 `xp.json`

```jsonc
{
  "format":"XP-v1",
  "log":[
    {"id":1,"ts":"2025-05-18T09:45:00Z","delta":10,"source":"ALG1:AS045_2_q17"}
  ]
}
```

### 4.4 `prefs.json`

```jsonc
{
  "xp_since_mixed_quiz":40,
  "last_as":"ALG1:AS045_2",
  "ui_theme":"default"
}
```

---

## 5 Scheduling — FSRS‑5 (imported)

The app uses the open‑source **`ts‑fsrs`** library for all scheduling computations.

```bash
npm i ts-fsrs
```

```ts
import { Scheduler, Rating } from 'ts-fsrs';
const fsrs = new Scheduler();
```

### 5.1 Grade Mapping

* **Incorrect answer** → grade **1**.
* **Correct answer** → UI prompts learner to self‑rate:

  | Button    | FSRS grade |
  | --------- | ---------- |
  | **Easy**  | 5          |
  | **Okay**  | 4          |
  | **Hard**  | 3          |
  | **Again** | 2          |

UI passes the chosen grade (5‑2) to `fsrs.nextReview()`. If the learner skips rating (timeout), default to **grade 4**.

### 5.2 Saved AS state (`mastery.json`) Saved AS state (`mastery.json`)

Each AS stores exactly the fields required by FSRS‑5:

```jsonc
"ALG1:AS045_2": {
  "status": "in_progress",   // unseen | in_progress | mastered
  "s": 0.12,                  // stability
  "d": 0.36,                  // difficulty
  "r": 0,                     // successive correct reps
  "l": 0,                     // lapse count
  "next_due": "2025-05-19T10:00:00Z",
  "next_q_index": 3
}
```

### 5.3 Review Update Logic

```ts
const grade = deriveGrade(answerCorrect, answerTimeMs); // 1,4,5
const [newState] = fsrs.nextReview(mastery[asId], grade);
mastery[asId] = {...newState, status:'in_progress', next_q_index:advanceIdx()};
```

`next_due` is `newState.due` (Date derived from interval days).

### 5.4 Implicit Prerequisite Credit

Performed only when **grade ≥ 4** on the advanced AS.

```ts
for (const P of prereqASs(mainAS)) {
  const virtGrade = Rating.Good; // virtual grade 4
  const [stateP] = fsrs.nextReview(mastery[P], virtGrade);
  const dampInterval = Math.max(1, Math.round(alpha_implicit * weight(mainAS, P) * stateP.interval));
  mastery[P] = {
    ...stateP,
    interval: dampInterval,
    next_due: addDays(now, dampInterval)
  };
};
}
```

### 5.5 Constants

```
alpha_implicit      = 0.30
review_gap_min_m    = 10  # minutes before same topic repeats; non-interference guard
```

## 6 Mastery Criteria Mastery Criteria

*AS mastered* → `n ≥ 3` **and** last three grades = 5.
*Topic mastered* → all its ASs mastered. Periodic mixed quizzes detect regression.

---

## 7 Lesson Flow

Status transitions: **unseen → in\_progress → mastered**.

1. Markdown exposition.
2. Serve questions sequentially until **two consecutive grades = 5** or pool exhausted.
3. Update FSRS-5 each attempt; advance `next_q_index`.
4. If mastery achieved during session, mark AS `mastered`.

If pool exhausts without two 5s, AS stays `in_progress` and will resurface via FSRS-5 (interval = 1 day after mistakes).

---

## 8 Task Selection

### 8.1 Candidate Pools

* **Overdue AS reviews** – any AS with `next_due ≤ now`.
* **New AS** – AS with `status='unseen'` and **all its `prereqs` mastered**.
* **Mixed quiz** – when `prefs.xp_since_mixed_quiz ≥ 150`.

### 8.2 Priority Formula Priority Formula

```
priority = base + overdue_bonus + foundational_gap_bonus + distance_bonus

base: review 5 | new_as 3 | mixed_quiz 2

overdue_bonus          = clamp(floor(days_overdue),0,5)
foundational_gap_bonus = 3 * overdue_prereqs_covered(candidate_as)
distance_bonus         = min(5, graph_distance(prefs.last_as, candidate_as))
```

`overdue_prereqs_covered` counts prerequisite ASs that are themselves overdue
*Graph distance* uses undirected shortest path; disconnected → bonus 5.

### 8.3 Execution Rules

* Reject candidate if same topic as `prefs.last_as` and elapsed < review\_gap\_min\_m.
* Awards: +10 XP per AS question, +20 per mixed‑quiz question.
* Increment `xp_since_mixed_quiz` after each award; reset to 0 after full mixed quiz submission.
* Update `prefs.last_as` on task completion.

---

## 9 Graph Distance Cache

Merged prerequisite graph built at startup; Floyd–Warshall computes all‑pairs undirected distances. Re‑compute only when course folders are added/updated.

---

## 10 Mixed Quiz Assembly

```
trigger: xp_since_mixed_quiz ≥ 150
eligible = {AS | AS.mastered AND last_attempt ≤ 30 days}
weight  ∝ days_overdue (0 if not overdue)
select 15 questions cycling deterministically through each AS’s next_q_index
record grades, update FSRS-5, advance indices
after submission → xp_since_mixed_quiz = 0
```

---

## 11 Dynamic Question Exposure

`next_q_index` advances after **every** attempt (lesson, review, mixed quiz).

---

## 12 UI Components

---

## 13 Error Handling

* **Autosave** — after every answer, write to `save/` files. If write fails, retry with exponential back‑off; show toast after 3 consecutive failures.
* **Schema violations** — a malformed AS, topic, or question is isolated: engine marks it `disabled`, excludes from scheduling, and logs details to `error.log`.
* **Missing content** — if Markdown or YAML missing, UI shows “Content unavailable”; AS still schedulable to avoid blocking graph progression.
* **Disk full / permission errors** — toast with retry / open‑folder button.

---

* Missing Markdown or YAML → “Content unavailable”; AS still schedulable.
* Disk errors prompt retry toast; autosave every answer.

---

## 14 Unlock Rule

Topic unlocks when **all** prerequisite ASs are mastered; first AS enters candidate pool as `new_as`.

---

## 15 UI Text Guidelines

Learner‑facing text should say **Skill** (not AS). Examples:

* Button – **Next Skill**
* Toast – **Skill mastered!**
* Progress legend – Unseen / In‑Progress / Mastered / Overdue

---

## 16 Question‑File Schema (`as_questions/<as-id>.yaml`)

```yaml
format: ASQ-v1
id: ALG1_AS045      # must match owning AS id without _qN suffix
pool:
  - id: q1
    stem: |-
      Solve \(x^2-5x+6=0\).
    choices: ["x=2 or x=3", "x=−2 or x=−3", "x=1 or x=6", "No real roots"]
    correct: 0        # 0‑based index into choices
    solution: |-
      Factor: \((x-2)(x-3)=0\).
  - id: q2
    stem: |-
      Which expression equals the discriminant of \(ax^2+bx+c=0\)?
    choices: ["b^2−4ac", "4ac−b^2", "b^2+4ac", "−b^2−4ac"]
    correct: 0
```

*At least 20 items per file.*  Keys: `stem` (Markdown), `choices[]` (plain text), `correct` (index), optional `solution` (Markdown).  Conforms to JSON‑Schema `schema/asq-v1.json`.

## 17 Markdown Conventions (`as_md/*.md`)

* CommonMark 0.30 + GitHub tables.
* Inline math `\( … \)`, display math `$$ … $$` via MathJax 3 locally.
* Images: PNG/SVG under `media/`, referenced relatively.
* Sanitised by DOMPurify; external links prompt “Open in system browser?”.

## 18 JSON Schema Directory (`schema/`)

* `topic-v1.json`, `asq-v1.json`, `mastery-v2.json`, `attempts-v1.json`, `prefs-v1.json`, `catalog-v1.json`.
* Validation via **AJV 8** in TypeScript build.

## 19 Tech‑Stack & Build Pipeline

| Layer     | Choice                                                                               |
| --------- | ------------------------------------------------------------------------------------ |
| App shell | **Tauri 1.x** (Rust + WebView)                                                       |
| UI        | **React 18 + TypeScript 5**                                                          |
| State     | **Redux Toolkit**                                                                    |
| Bundler   | **Vite**                                                                             |
| Tests     | Vitest + React Testing Library                                                       |
| CI        | GitHub Actions → lint → type‑check → unit tests → Tauri builds (Win, Linux, Android) |

## 20 Persistence Details

| Platform                                   | API                  | Path                                  |
| ------------------------------------------ | -------------------- | ------------------------------------- |
| Desktop                                    | Tauri FS             | `~/.mathacademy/`                     |
| Android                                    | Capacitor Filesystem | `Android/data/com.mathacademy/files/` |
| Atomic write: write `.tmp`, fsync, rename. |                      |                                       |

## 21 Profiles

Single profile default; optional multi‑learner via `profiles/<name>/` subfolders. Active profile path stored in `prefs.json`.

## 22 Logging

* `logs/error.log` – fatal errors.
* `logs/debug.log` – dev builds only. 5 MB rotation ×3.

## 23 Sample Course

`sample_course/` shipped with CI: 1 topic, 2 ASs, seed `mastery.json` for smoke tests.

## 24 Accessibility & i18n

* All interactive elements focusable; `aria-label` on inline math.
* UI strings in `i18n/en.json`; additional locales drop parallel JSON.

## 25 Performance Budgets

* Expected full graph: 2k–5k topics; loads < 1 s cold.
* Long‑term: 100k+ topics → loader keeps ≤500 recently visited nodes + 2‑hop prereqs resident.
* In‑RAM distance matrix capped to 1 000×1 000; other distances computed on demand.

## 26 Versioning & Migration

Every JSON file carries `format`.  Upgrade path: if file format older, run `migrations/migrate_<from>_<to>.ts`, then back‑up original to `backup_YYYYMMDD/`.

## 27 Security Sandbox

CSP: `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self';`.  External links confirm dialog.

## 28 Deliverables & Packaging

| Target                             | Artifact               | Notes            |
| ---------------------------------- | ---------------------- | ---------------- |
| Windows 10+                        | `mathacademy.exe`      | portable, signed |
| Linux (glibc ≥ 2.27)               | `mathacademy.AppImage` | portable         |
| Android (MinSdk23)                 | `mathacademy.apk`      | side‑load MVP    |
| No installer; double‑click to run. |                        |                  |

## 29 Testing & QA Checklist

1. First‑run loads sample course.
2. Answer 20 AS questions – intervals grow as per FSRS-5.
3. Implicit prerequisite credit updates `next_due`.
4. Mixed quiz triggers at 150 XP.
5. Non‑interference gap enforced (≥10 min before same topic).
6. Hot‑reload JSON edit patches store without restart.
7. Autosave file survives simulated crash.

## 30 Recovery & Reset

* Export progress → zip of `save/` files.
* Reset course → move profile to `archive/<timestamp>/`, seed new blanks.
* Import rejects bundle if `format` newer than runtime.

## 31 Constants Catalogue

```
base_interval_days        = 1
review_gap_min_m          = 10   # non‑interference guard
alpha_implicit            = 0.3
distance_bonus_cap        = 5
xp_per_as_question        = 10
xp_per_mixed_quiz_q       = 20
mixed_quiz_trigger_xp     = 150
```

## 32 Graph Size Expectation

* Short‑term: 2 k–5 k topics.
* Long‑term: 100 k+ topics; demand‑load keeps memory low.
