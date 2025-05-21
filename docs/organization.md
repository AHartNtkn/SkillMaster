Adding examples should not have merged sections; I collapsed them by mistake.
Below is the same plan with the **full original 10-section outline**, now *including concrete examples*.

---

### **Knowledge-Graph Content-Development Workflow**

*(Copy to **`/docs/KG_Workflow.md`**)*

---

#### **0 Scope**

Repo-native process to **submit KG → auto-import dummy nodes → open one issue per skill**. Extends `GraphGen.md`.

---

#### **1 Actor Roles**

| Role Responsibility |                                            |
| ------------------- | ------------------------------------------ |
| **Course Author**   | Draft KG, open *KG-Import* PR, fix CI.     |
| **KG Bot**          | Validate KG, write stubs, spawn AS issues. |
| **Content Author**  | Resolve AS issues (explanation + MCQs).    |
| **Maintainer**      | Review PRs, tune bot, merge.               |

---

#### **2 Directory Layout (after import)**

```
content/courses/EA/
  KG.yml
  skills/          # one .md per AS (blank)
  quizzes/         # one .yaml per AS (blank)
  explanations/    # one .md per AS (blank)
scripts/kg_import.py
.github/
  workflows/kg-ci.yml
  ISSUE_TEMPLATE/as.yaml

```

---

#### **3 KG Submission Format**

> **File:** `KG.yml` (JSON or YAML) – four ordered blocks.

1. **Catalog Header**

   ```
   {
     "format": "KG-Catalog-v1",
     "course_id": "EA",
     "title": "Elementary Arithmetic Knowledge Graph (Extended)",
     "root_topics": ["EA:T001"],
     "created": "2025-05-19"
   }

   ```
2. **Topics**

   ```
   **Topic ID:** `EA:T001`
   **Name:** Number Sense & Counting
   **Atomic Skills:** EA:AS001 EA:AS002 EA:AS003 EA:AS004

   **Topic ID:** `EA:T034`
   **Name:** Multi-Step Word Problems
   **Atomic Skills:** EA:AS191 EA:AS192 EA:AS193 EA:AS194 EA:AS195

   ```
3. **Atomic Skill Catalog**

   ```
   [
     { "id": "EA:AS001",
       "title": "Identify numerals 0-9",
       "desc": "Recognize and name the written symbols for numbers 0-9." },

     { "id": "EA:AS194",
       "title": "Solve two-step word problems (mult/div with others)",
       "desc": "Perform calculations for two-step story problems involving ×, ÷, +, or −." }

     /* …195 objects total… */
   ]

   ```
4. **Prerequisite Edges**

   ```
   source_skill_id,destination_skill_id,weight
   EA:AS001,EA:AS004,1.0
   EA:AS004,EA:AS005,1.0
   EA:AS191,EA:AS194,1.0

   ```

---

#### **4 Submission Workflow (example)**

1. Author runs `kg_import.py --dry-run KG.yml` locally → passes.
2. Opens PR **“KG-Import: EA”**, attaches `KG.yml`.
3. CI (`kg-ci.yml`) validates, commits 195 stub files, posts JSON summary.
4. KG Bot reads summary → opens 195 issues (see §6).
5. Author fixes CI errors if any, maintainer merges.

---

#### **5 Import CLI + Example Run**

```
$ python scripts/kg_import.py content/courses/EA/KG.yml
✓ Header valid
✓ 34 topics, 195 atomic skills
✓ 412 edges checked
→ 195 stubs written (skills, quizzes, explanations)
→ summary.json printed for KG Bot

```

---

#### **6 KG Bot Issue Generation Example**

*Template (**`ISSUE_TEMPLATE/as.yaml`**):*

```
name: "✎ Write content for {{ id }}"
body:
  - type: markdown
    attributes:
      value: |
        **Skill**: {{ title }}
        **Description**: {{ desc }}

        Add:
        1. Explanation (300-600 words).
        2. ≥ 20 MCQs (Bloom 1-3).

labels: ["content","atomic-skill"]

```

*Generated issue for **`EA:AS194`**:*

```
Title: ✎ Write content for EA:AS194

Skill: Solve two-step word problems (mult/div with others)

Description: Perform calculations for two-step story problems involving ×, ÷, +, or −.

```

---

#### **7 App Handling of Dummy Nodes**

* When `skills/<id>.md` is empty → display **“Under Construction”**.
* Dummy nodes excluded from spaced-repetition scheduling.
* Progress bars treat dummy nodes as 0-score (not invisible).

---

#### **8 Quality Checklist (CI-enforced)**

* Header keys present and valid.
* Topics unique; every AS appears in ≥1 Topic.
* Each AS object has non-empty `id`, `title`, `desc`.
* Edge list IDs exist; no self-loops.
* `kg_import.py --dry-run` exit 0.
* Stub files generated; existing non-blank files untouched.
* Jest snapshot: app renders dummy node safely.

Merge blocked until all items pass.

---

#### **9 FAQ**

*Modify KG after import?* – open a *KG-Patch* PR; bot re-syncs issues.
*YAML vs JSON?* – both accepted; tooling normalizes to JSON Schema.

