# Knowledge‑Graph Generation Guide

## 0 Scope

Define the **prerequisite structure** for a new course as a directed acyclic graph (DAG).  No lesson text, questions, or UI considerations belong here.  The output is a set of JSON/YAML files that the runtime can later decorate with content.

*Audience*: content engineers building course plans for **adult learners already fluent in prerequisites**.  Goal is *maximal depth* (finest reasonable granularity) and *complete coverage* of the selected domain.

---

## 1 Node Model

| Node type             | Meaning                                                                      | Mandatory fields      |
| --------------------- | ---------------------------------------------------------------------------- | --------------------- |
| **Atomic Skill (AS)** | Smallest action that can be deliberately practiced and objectively assessed. | `id`, `title`, `desc` |
| **Topic**             | Cohesive bundle of 1‑n Atomic Skills used as a macro for dashboards.         | `id`, `name`, `as[]`  |

*Rule 1*: every learner action maps to exactly one AS.

*Rule 2*: every AS belongs to exactly one Topic.

---

## 2 Edge Semantics

A directed edge **A → B** encodes **implicit practice containment**:

> *Any exercise that trains B unavoidably trains A.*

Consequences:

* Edge existence does **not** demand prior mastery of A; it demands that A’s mechanics are embedded in B’s tasks.
* If multiple independent sub‑skills of A are required, connect each individually: A₁ → B, A₂ → B.
* Remove an edge if you can design assessment items for B that do **not** touch A.

Graph must remain a **DAG**.  Cycles imply mutual containment and violate the definition of “atomic”.

Optional `weight ∈ (0,1]` may score the proportion of B’s practice attributable to A (used by runtime analytics; leave `1.0` if unsure).

---

## 3 Filesystem Layout

```
course/<COURSE_ID>/
  catalog.json         # metadata stub
  topics/              # one file per Topic
  skills.json          # global registry of AS nodes
  edges.csv            # adjacency list (src,dst,weight)
```

### 3.1 `catalog.json`

```jsonc
{
  "format": "KG-Catalog-v1",
  "course_id": "ALG2",
  "title": "Algebra II Knowledge Graph",
  "root_topics": ["ALG2:T001"],
  "created": "2025-05-18"
}
```

### 3.2 Topic file (e.g. `topics/ALG2_T010.json`)

```jsonc
{
  "id": "ALG2:T010",
  "name": "Quadratic Transformations",
  "as": ["ALG2:AS201", "ALG2:AS202"]
}
```

### 3.3 `skills.json` (fragment)

```jsonc
[
  {"id": "ALG2:AS201", "title": "Complete the square", "desc": "Rewrite ax²+bx+c as a(x+h)²+k."},
  {"id": "ALG2:AS202", "title": "Identify vertex from vertex form", "desc": "Extract (h,k) from y=a(x+h)²+k."}
]
```

### 3.4 `edges.csv`

```
source,destination,weight
ALG1:AS150,ALG2:AS201,1.0
ALG2:AS201,ALG2:AS202,0.8
```

CSV is chosen for human diff readability; use UTF‑8 with LF line ends.

---

## 4 Construction Workflow

1. **Enumerate domain actions**

   * Scan authoritative syllabi & problem sets; extract every discrete “verb + object” (e.g. *factor quadratic*, *solve linear system*).
2. **Atomicity pass**

   * Split any action that could be assessed in multiple, independent ways into separate AS candidates.
3. **Edge derivation**

   * For each ordered pair (X,Y) where X≠Y ask: *“Does every valid exercise for Y inevitably exercise X?”*  If *yes*, record X → Y.
4. **Cycle test**

   * Run a topological sort.  If impossible, refine or merge offending skills until acyclic.
5. **Topic clustering**

   * Group adjacent AS (high edge density ≤ 2 hops) under a Topic label that summarises their theme.
6. **Integration**

   * Attach incoming/outgoing edges to existing global graph.  Resolve duplicates by ID or exact description match; if semantic overlap but different granularity, prefer finer node and redirect edges.
7. **Review gate** (see §5).
8. **Freeze**

   * Tag repository commit; notify content writers that node set is stable.

Avoid prescribing tools (draw‑apps, spreadsheets, etc.).  Use any medium that lets you deliver the required file set.

---

## 5 Quality Assessment Rubric

Score each axis 0–5.  Threshold for acceptance: **≥ 22/30**.

| Axis                | 0                           | 3                | 5                              |
| ------------------- | --------------------------- | ---------------- | ------------------------------ |
| **Coverage**        | Large known areas missing   | Minor gaps       | Exhaustive within stated scope |
| **Granularity**     | Mixed, uneven               | Mostly atomic    | Uniformly atomic               |
| **Edge validity**   | Many spurious/omitted       | Few issues       | Every edge proven minimal      |
| **Non‑redundancy**  | Duplicated skills           | Sparse overlap   | Zero duplication               |
| **Depth coherence** | Jumps in abstraction        | Occasional jump  | Smooth incremental depth       |
| **Integration**     | Conflicts with existing IDs | Minor merge work | Seamless merge                 |

### 5.1 Checklist

* No cycles.
* All nodes reachable from at least one `root_topic`.
* Edge count ≤ n(n‑1)/4 (heuristic for readable density).
* Median out‑degree between 1 and 3.
* Text fields are sentence‑style, ≤ 120 chars.

Peer reviewers must supply written justification for any axis scored < 4.
