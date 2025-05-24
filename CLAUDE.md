# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Unified Design Specification: Local Skill-Based Mastery App
1. Purpose
This document specifies the design for a fully offline, single-learner application that implements an adaptive, knowledge-graph-based pedagogy. Key features include prerequisite-aware lessons, a Spaced Repetition System (SRS) with implicit prerequisite credit, non-interference task ordering, cross-course remediation, and periodic mixed quizzes. All canonical data is stored in plain JSON or YAML, with scheduling parameters being intrinsic to the system and not user-editable.

2. Terminology
Atomic Skill (AS): The smallest unit of learning, representing a single, bite-sized skill or concept (e.g., “Solve a quadratic by factoring”). Every learner action within the app maps to exactly one AS. Learner-facing text will refer to this as a "Skill."

Topic: A cohesive collection of one to many Atomic Skills, used for macro-level organization and progress dashboards. Every AS must belong to exactly one Topic.

Knowledge Graph (KG): The complete map of all Topics and Atomic Skills and their prerequisite relationships, structured as a directed acyclic graph (DAG).

3. Knowledge Graph Design and Curation
The integrity and effectiveness of the learning experience depend critically on a well-designed Knowledge Graph. This section outlines the principles for its creation and maintenance. The target audience for KG construction is content engineers building course plans for adult learners who are assumed to be fluent in the prerequisites of the course material. The goal is maximal depth (finest reasonable granularity) and complete coverage of the selected domain.

3.1. Node Model
Node type

Meaning

Mandatory fields

Atomic Skill

Smallest action that can be deliberately practiced and objectively assessed.

id, title, desc

Topic

Cohesive bundle of 1-n Atomic Skills used as a macro for dashboards.

id, name, ass[]

Rule 1: Every learner action maps to exactly one Atomic Skill.

Rule 2: Every Atomic Skill belongs to exactly one Topic.

3.2. Prerequisite Edge Semantics
A directed prerequisite edge from Atomic Skill A to Atomic Skill B (defined in B's prereqs list) encodes implicit practice containment:

Any exercise that trains B unavoidably trains A.

Consequences:

Edge existence does not demand prior mastery of A; it demands that A’s mechanics are embedded in B’s tasks.

If multiple independent sub-skills of A are required for B, each should be connected individually: A₁ → B, A₂ → B.

An edge should be removed if assessment items for B can be designed that do not involve A.

The graph must remain a DAG. Cycles imply mutual containment and violate the definition of "atomic."

An optional weight ∈ (0,1] on the prerequisite relationship scores the proportion of B’s practice attributable to A (used by runtime analytics; defaults to 1.0 if unsure).

3.3. Construction Workflow
Enumerate Domain Actions: Scan authoritative syllabi and problem sets; extract every discrete “verb + object” (e.g., factor quadratic, solve linear system).

Atomicity Pass: Split any action that could be assessed in multiple, independent ways into separate AS candidates.

Edge Derivation: For each ordered pair of AS candidates (X,Y) where X≠Y, ask: “Does every valid exercise for Y inevitably exercise X?” If yes, record X as a prerequisite for Y.

Cycle Test: Run a topological sort on the graph. If impossible, refine or merge offending skills until the graph is acyclic.

Topic Clustering: Group adjacent ASs (those with high edge density, typically ≤ 2 hops apart) under a Topic label that summarizes their theme.

Integration (for existing graphs): Attach incoming/outgoing edges to the existing global graph. Resolve duplicate ASs by ID or exact description match. If there's semantic overlap but different granularity, prefer the finer-grained node and redirect edges accordingly.

Review Gate: Subject the graph to the Quality Assessment Rubric (see below).

Freeze: Once approved, tag the repository commit and notify content writers that the node set is stable for content creation (explanations, questions).

Content authors should use any medium that allows them to deliver the required file set; specific drawing applications or spreadsheets are not prescribed.

3.4. Quality Assessment Rubric
Each axis is scored from 0 to 5. A threshold of ≥ 22/30 is required for acceptance.

Axis

0 (Poor)

3 (Adequate)

5 (Excellent)

Coverage

Large known areas missing

Minor gaps

Exhaustive within stated scope

Granularity

Mixed, uneven

Mostly atomic

Uniformly atomic

Edge Validity

Many spurious/omitted

Few issues

Every edge proven minimal

Non-redundancy

Duplicated skills

Sparse overlap

Zero duplication

Depth Coherence

Jumps in abstraction

Occasional jump

Smooth incremental depth

Integration

Conflicts with existing IDs

Minor merge work

Seamless merge

Peer reviewers must supply written justification for any axis scored < 4.

3.5. Quality Checklist
No cycles in the prerequisite graph.

Edge count should be reasonable (heuristic: ≤ n(n‑1)/4, where n is the number of ASs, to maintain readable density).

Median out-degree (number of skills an AS is a prerequisite for) should ideally be between 1 and 3.

Text fields (title, desc for ASs; name for Topics) should be in sentence case and generally ≤ 120 characters.

4. User Interface and Experience
The application will feature a clean, intuitive interface designed for focused learning. Navigation is primarily handled by a bottom tab bar, providing access to the main sections of the app.

4.1. Main Screens & Navigation
A tab bar at the bottom of the screen (or side/top on larger displays if appropriate) provides access to the following primary screens:

Home (Dashboard): The default screen upon opening the app.

Displays overall XP progress towards the next Mixed Quiz.

Highlights the number of Skills due for review.

Presents the "Next Task" (the highest priority AS or Mixed Quiz) with a clear call to action (e.g., "START NEXT SKILL" button).

May include a user profile icon or summary.

Learning Screen: This screen is activated when the user starts a new skill or a review session. It has several phases:

Header: Displays the current Skill ID and title (e.g., "ALG1:AS045_2 - Solve by Factoring"), a button to "Review Explanation," and current question progress (e.g., "Question 1 of 20"). A home button allows exiting the learning session (with confirmation).

Exposition Phase: (For new skills or when "Review Explanation" is tapped) Displays the Markdown content for the current AS in a modal or dedicated section. This includes text, formulas (rendered with MathJax), and images. A button like "Start Questions" transitions to the question phase.

Question Phase:

Presents the question stem (Markdown).

Lists multiple-choice choices.

Allows the user to select one answer.

A "Submit Answer" button becomes active once an answer is selected.

Feedback Phase:

Indicates if the answer was "Correct!" or "Incorrect."

Displays the solution (Markdown).

If correct, FSRS self-rating buttons appear: "Again (Hardest)," "Hard," "Okay," "Easy."

A "Next Question" button (or "Finish Skill" if it's the last question and mastery is achieved/attempted) proceeds.

Progress Screen:

Visualizes the learner's progress through the knowledge graph (e.g., using a D3 force-directed graph or similar).

Nodes (representing Topics or ASs) are color-coded based on their status: Unseen, In Progress, Mastered, Overdue.

Provides a legend for the color codes.

Library Screen:

Lists all available courses (e.g., "Algebra I (ALG1)," "Geometry (GEOM1)").

For each course, may show summary information (e.g., number of Topics, Skills).

Allows the user to "Explore Course" to browse its topics and skills (details TBD, could be a hierarchical list or link to the progress graph focused on that course).

Settings Screen:

Appearance: Toggle for Dark Mode.

Data Management: Buttons for "Import Progress," "Export Progress," and "Reset Course Progress."

About: Displays application name and version.

4.2. Key UI Interactions & Elements
Skill Progression: The UI clearly guides the user from exposition to questions, feedback, and self-rating.

Explanation Access: The AS explanation is readily available via a "Review Explanation" button/link during a learning session, displayed in a modal or a dedicated view.

Answer Submission: Users select an answer, then explicitly submit it.

FSRS Self-Rating: After a correct answer, clear buttons allow the user to rate the perceived difficulty, which directly impacts the FSRS scheduling.

Confirmation Dialogs: Critical actions like exiting a learning session mid-way or resetting progress will use custom confirmation dialogs (not native browser alerts).

Notifications/Toasts: Non-blocking information (e.g., "Skill Mastered!", "Autosave failed") will be shown via toasts.

Responsive Design: The UI should adapt to different screen sizes, particularly for mobile and desktop use. The tab bar might be hidden during focused learning sessions on smaller screens.

4.3. UI Text Guidelines
User-facing text should use the term "Skill" instead of "Atomic Skill" or "AS."

Example Button: "Next Skill"

Example Toast: "Skill mastered!"

Example Progress Legend: Unseen / In-Progress / Mastered / Overdue

5. Core Application Flow & Task Selection
5.1. Learner Progression
An Atomic Skill progresses through three lifecycle stages:

Unseen: The initial state before a learner has interacted with the skill.

In Progress: The state after the first attempt and before mastery is achieved.

Mastered: Achieved when a skill has been practiced at least three times (n ≥ 3) and the last three grades received are all '5' (Easy).

A Topic is considered mastered when all of its constituent Atomic Skills are mastered.

5.2. Task Candidate Pools
The system selects the next task for the learner from three distinct pools:

Overdue AS Reviews: Any Atomic Skill where the next_due date is less than or equal to the current time (next_due <= now). This includes skills due today.

New AS: An "unseen" Atomic Skill for which all prerequisite ASs have the "mastered" status.

Mixed Quiz: Triggered when the learner accumulates sufficient experience points (xp_since_mixed_quiz ≥ 150).

5.3. Task Priority Formula
To select the most appropriate task, the system calculates a priority score for each candidate.

priority = base + overdue_bonus + foundational_gap_bonus + distance_bonus

Base Scores:

Review: 5

New AS: 3

Mixed Quiz: 2

Bonus Scores:

overdue_bonus: clamp(floor(days_overdue), 0, 5)

foundational_gap_bonus: 3 * overdue_prereqs_covered(candidate_as) (This counts the number of prerequisite topics for the candidate AS that contain at least one overdue AS.)

distance_bonus: min(5, graph_distance(last_as, candidate_as)) (Uses the shortest path distance in the knowledge graph; a distance of 5 is assigned if the nodes are disconnected.)

5.4. Execution Rules
Non-Interference: A candidate task is rejected if it belongs to the same Topic as the last completed task and less than a minimum time has passed (review_gap_min_m = 10 minutes).

XP Awards: The learner earns Experience Points (XP) for completing questions: +10 XP per standard AS question and +20 XP per mixed-quiz question.

State Updates: After a task is completed, the system updates prefs.json with the new last_as and the accumulated xp_since_mixed_quiz.

6. Spaced Repetition System (SRS) & Grading
The application uses an FSRS-5 (Free Spaced Repetition Scheduler) algorithm for scheduling all reviews.

6.1. Grade Mapping
When a learner answers a question:

An incorrect answer is automatically graded as 1.

A correct answer prompts a self-evaluation from the learner:

Easy: Grade 5

Okay: Grade 4

Hard: Grade 3

Again: Grade 2

6.2. Implicit Prerequisite Credit
When a learner scores a grade of 4 ("Okay") or 5 ("Easy") on an advanced AS, the system grants implicit credit to its direct prerequisites. For each prerequisite P of the main skill mainAS (as listed in mainAS's prereqs), a virtual grade of 4 (Good) is applied to P. The new review interval for P is then calculated and dampened:

dampInterval = max(1, round(alpha_implicit * weight(mainAS, P) * stateP.interval))

Where alpha_implicit = 0.30 and weight(mainAS, P) is the weight of P as a prerequisite for mainAS. stateP.interval is the current interval of prerequisite P.

Note: “stateP.interval” should be read as “interval returned by the virtual-grade update”.

Intended sequence

- Start with the prerequisite’s current state
`oldInterval = mastery[P].interval // interval before implicit credit`

- Apply the virtual grade 4 through `fsrs.nextReview()` → returns
`virtualInterval` (the interval FSRS would schedule if the learner had actually reviewed P and scored 4)

Dampen that new interval to reflect “partial” practice credit

```
dampInterval = max(1,
                   round(alphaImplicit * weight(mainAS,P) * virtualInterval))
```

Write `dampInterval` back to `mastery[P].interval` and recompute `next_due.`

7. Lesson and Quiz Structure
7.1. Lesson Flow
For a new or "unseen" skill, the lesson proceeds as follows:

The Markdown-based exposition for the AS is displayed (from as_md/<as_id>.md).

The learner is served questions sequentially from the AS question pool (from as_questions/<as_id>.yaml), starting from next_q_index.

The session continues until the learner achieves two consecutive grades of 5 ("Easy") or the question pool is exhausted.

The skill's FSRS state (in mastery.json) and next_q_index are updated after each answer.

If the mastery criteria are met during the session, the AS status is set to mastered.

7.2. Mixed Quiz Assembly
Trigger: A mixed quiz is generated when xp_since_mixed_quiz (in prefs.json) reaches 150.

Eligibility: Questions are drawn from ALL atomic skills (ASs) that have pending reviews. Note that ONLY the FSRS system can determine this; THERE IS NO SEPARATE TRACKER FOR WHEN REVIEWS ARE NEEDED!

IMPORTANT CLARIFICATION: A skill has a "pending review" if and only if its next_due timestamp is less than or equal to the current time (next_due <= now). The terms "pending review", "overdue", and "due for review" all mean the same thing in this system. There is no distinction between being "due" and being "overdue".

Selection: The system selects 15 questions. The selection is weighted proportionally to how overdue a skill is (skills due today have a small positive weight, skills due in the past have larger weights based on days overdue). Questions for a given skill are pulled sequentially using its next_q_index.

FSRS is updated per-question.

Post-Quiz: After the quiz is submitted, and xp_since_mixed_quiz is reset to 0.

8. Filesystem and Data Formats
The application's data is organized in a clear, file-based structure, designed to be easily managed by content authors.

8.1. Directory Layout
app_root/
  courses.json                 # Registry of all installed courses
  course/
    <course_id>/               # Directory name matches course_id from catalog.json (e.g., "EA")
      catalog.json             # Course metadata
      topics/                  # Contains one JSON file per Topic
      skills/                  # Contains one JSON file per Atomic Skill
      as_md/                   # Contains one Markdown file per AS for explanations
      as_questions/            # Contains one YAML file per AS for question pools
  save/
    mastery.json               # FSRS-5 scheduling state for all AS and Topics
    attempt_window.json        # A log of recent grades for each AS quiz
    xp.json                    # Log of all experience point transactions
    prefs.json                 # User preferences and session state
  .cache/
    index.db                   # An optional, auto-generated cache for graph distances

8.1.1. File Naming Convention
To simplify path resolution and reduce complexity, all file paths should correspond directly to the course_id specified in the catalog.json:

- **Directory Structure**: The course directory name should match the course_id from catalog.json
- **Topic Files**: Named as `{course_id}_T{number}.json` (e.g., `EA_T001.json` for course "EA")
- **Skill Files**: Named as `{skill_id_with_underscores}.json` (e.g., `EA_AS001.json` for skill "EA:AS001")
- **Markdown Files**: Named as `{skill_id_with_underscores}.md` (e.g., `EA_AS001.md`)
- **Question Files**: Named as `{skill_id_with_underscores}.yaml` (e.g., `EA_AS001.yaml`)

This convention eliminates the need for complex ID-to-path mapping and makes the file system more predictable and maintainable.

8.2. Key Data Schemas

Course Registry (courses.json)
The root registry lists all available courses. The "id" field should match the course_id from the corresponding catalog.json and the directory name.

{
  "courses": [
    {
      "id": "EA",
      "name": "Elementary Arithmetic", 
      "description": "Basic arithmetic operations and number sense"
    }
  ]
}

Atomic Skill Definition (skills/<as_id>.json)
This is the new canonical source for a skill's definition and its prerequisites. Each AS has its own file.

{
  "id": "ALG1:AS045_2",
  "title": "Apply quadratic formula",
  "desc": "Use the formula to find roots for equations in the form ax²+bx+c=0.",
  "prereqs": [
    { "id": "ALG1:AS030_2", "weight": 0.6 },
    { "id": "ALG1:AS031_1", "weight": 1.0 }
  ]
}

prereqs: An array of prerequisite objects.

id: The ID of the prerequisite Atomic Skill.

weight (optional): A value from 0 to 1 representing the proportion of the main skill's practice attributable to this prerequisite. Defaults to 1.0.

Course Catalog (catalog.json)

{
  "format": "Catalog-v1",
  "course_id": "ALG1",
  "title": "Algebra I",
  "topics": ["ALG1:T001", "ALG1:T002", ...]
}

Topic File (topics/<topic_id>.json)

{
  "id": "ALG1:T045",
  "name": "Quadratic Formula",
  "ass": ["ALG1:AS045_1", "ALG1:AS045_2"]
}

AS Question File (as_questions/<as_id>.yaml)

format: ASQ-v1
id: ALG1:AS045_2 # Must match the AS ID of the skill this question pool belongs to
pool:
  - id: q1 # Unique within this file
    stem: |-
      Solve \(x^2-5x+6=0\).
    choices: ["x=2 or x=3", "x=-2 or x=-3", "x=1 or x=6", "No real roots"]
    correct: 0 # 0-based index into choices
    solution: |- # Optional, Markdown
      Factor: \((x-2)(x-3)=0\).

Each file must contain at least 20 question items.

Mastery State (mastery.json)
This file stores the complete FSRS-5 state for every Atomic Skill and Topic.

{
  "format": "Mastery-v2",
  "ass": {
    "ALG1:AS045_2": {
      "status": "in_progress", // "unseen", "in_progress", or "mastered"
      "s": 0.12,         // stability (FSRS parameter)
      "d": 0.36,         // difficulty (FSRS parameter)
      "r": 0,            // successive correct reps (FSRS parameter, though FSRS might use 'lapses' or similar)
      "l": 0,            // lapse count (FSRS parameter)
      "next_due": "2025-05-19T10:00:00Z", // ISO 8601 timestamp
      "next_q_index": 3  // The index of the next question to be served from this AS's pool
    }
  },
  "topics": {
    "ALG1:T045": {
      "status": "in_progress", // "unseen", "in_progress", or "mastered"
      "last_quiz_score": 0.92, // Score from the last topic-specific quiz, if applicable
      "last_quiz_date": "2025-05-18T09:50:00Z" // ISO 8601 timestamp
    }
  }
}

Preferences (prefs.json)

{
  "format": "Prefs-v1",
  "xp_since_mixed_quiz": 40,
  "last_as": "ALG1:AS045_2", // ID of the last AS the user interacted with
  "ui_theme": "default" // e.g., "default", "dark"
}

XP Log (xp.json)

{
  "format": "XP-v1",
  "log": [
    {"id": 1, "ts": "2025-05-18T09:45:00Z", "delta": 10, "source": "ALG1:AS045_2_q17"}
  ]
}

Attempt Window (attempt_window.json)
Stores recent grades for AS quizzes, useful for some UI displays or checks.

{
  "format": "Attempts-v1",
  "ass": {
    "ALG1:AS045_2": [5,5,4,5,5] // List of last few FSRS grades for this AS
  },
  "topics": {
    "ALG1:T045": [0.90, 0.95] // List of last few scores for this Topic's quizzes
  }
}

9. Error Handling & Persistence
Atomic Saves: All save operations (to save/ directory) should be atomic, writing to a temporary file first before renaming it to prevent data corruption.

Content Errors: If an AS is missing its Markdown or question file, the UI should display a "Content unavailable" message. The AS remains schedulable to avoid breaking prerequisite chains. Malformed data files should cause the associated content to be marked as disabled and logged, isolating the error without crashing the application.

Data Versioning: Every JSON and YAML file includes a format version string. The application should be prepared to run data migration scripts to update older file formats as the schema evolves.

Implementation State:

The application is parially implemented. The core interface, most datastructure, and most logic is implemented to some degree.

Your goal is to create a feature-complete implementation of what's described here. You are to import the FSRS implementation; don't implement it on your own.

As you implement features, make sure to add thorough tests, especially end-to-end tests, of all the functionality.

DO NOT implement a simple prototype which can act as a starting point. DO NOT EVER hardcode ANYTHING! DO NOT EVER make ANY placeholders! DO NOT implement ANYTHING that you do not plan to finish COMPLETELY then and there! You must periodically look back at this file and compare it thoroughly with the current implementation to identify shortcomings.

# Implementation Audit Log

## Audit - 2024-07-27

This audit compares the current state of the implementation (as of the review date) against the specifications in this document.

### 1. Feature Gaps / Incomplete Implementations

*   **Custom Confirmation Dialogs (Spec 4.2)**: The design specifies "custom confirmation dialogs (not native browser alerts)" for critical actions. Currently, `window.confirm()` is used (e.g., `app.js` for `confirmExit()`, `confirmExitQuiz()`; `SettingsView.js` for `confirmReset()`).
    *   **Action**: Implement custom modal dialogs for these confirmations.
*   **Topic Mastery Status Update (Spec 5.1)**: `MasteryState.TopicState` has a `status` field, but it does not appear to be updated to 'mastered' when all its constituent Atomic Skills (ASs) become mastered. `MasteryState.isTopicMastered()` can check this, but no code seems to call it to update the state.
    *   **Action**: Implement logic (likely in `CourseManager` or when an AS is mastered) to check and update the status of relevant topics in `mastery.json`.
*   **Graph Distance Cache (Spec 8.1)**: The `.cache/index.db` for optional, auto-generated graph distances is not implemented. `TaskSelector.calculateGraphDistance()` computes distances on-the-fly.
    *   **Action**: Implement caching for graph distances if performance becomes an issue.
*   **Data Migration Scripts (Spec 9)**: The design mentions that the "application should be prepared to run data migration scripts." No such framework or scripts are implemented.
    *   **Action**: Develop a strategy and mechanism for data schema migrations if future changes to data formats are anticipated.
*   **Testing (General Requirement)**: The "Implementation State" section requires "thorough tests, especially end-to-end tests." While a test setup (`tests/setup.js`, mock FSRS) exists, no actual test files (`*.test.js` or similar) performing assertions are present in the reviewed codebase.
    *   **Action**: Prioritize and implement comprehensive unit, integration, and end-to-end tests.
*   **Full Markdown Rendering (Spec 4.1, 7.1)**: `LearningView.renderMarkdown` and `MixedQuizView.renderMarkdown` provide very basic Markdown support (bold, italic, code, line breaks). The spec implies richer support for "text, formulas (rendered with MathJax), and images." While MathJax is invoked, the Markdown parser itself is minimal.
    *   **Action**: Integrate a more feature-complete Markdown parsing library (e.g., Marked, Markdown-it) to support images, tables, and other standard Markdown features.
*   **Question Progress Display (Spec 4.1)**: Learning screen header should show "current question progress (e.g., 'Question 1 of 20')." `LearningView.js` currently displays "Question X" but not "of Y".
    *   **Action**: Modify `LearningView.showQuestion()` to display total questions for the current AS (e.g., "Question ${questionNumber} of ${this.questions.length}").
*   **"Autosave Failed" Notification (Spec 4.2)**: Toast notifications are implemented for some actions, but not for "Autosave failed". `StorageService.saveToLocal` returns a boolean on success/failure, but this is not currently used by `CourseManager.saveState` to trigger a user notification.
    *   **Action**: Implement a toast notification if `saveState()` fails.

### 2. Discrepancies with Design Document

NONE FOUND

### 3. Hardcoding / Placeholders / Arbitrary Values

*   **Course Content Fallback (js/services/CourseManager.js)**: `getTopicFiles()` and `getSkillFiles()` contain hardcoded fallbacks to load content for course 'EA' if dynamic loading fails, even outside of a test environment.
    *   **Action**: Remove these hardcoded fallbacks for production code. Course content loading should be purely dynamic or based on configurations.
*   **Application Version (js/views/SettingsView.js)**: The application version is hardcoded as "v1.0.0" in `render()`.
    *   **Action**: Make the version dynamic, e.g., loaded from a configuration file or a build variable.

### 4. Minor Points & Clarifications

*   **Malformed Data File Handling (Spec 9)**: If `CourseManager` encounters errors loading course/topic/skill files, it logs errors and may skip loading the content. The design says "mark associated content as disabled". There isn't a formal "disabled" state; content is just absent.
    *   **Action**: This might be an acceptable implementation, but consider if a more formal "disabled content with error message" is needed in the UI.
*   **D3 Force Layout Parameters (js/views/ProgressView.js)**: Values like `distance(80)`, `strength(-300)`, `radius(30)` are set for the D3 graph. These are typical tuning parameters.
    *   **Action**: No action needed unless these are meant to be configurable per the design.

This audit provides a snapshot. Continuous review and testing will be necessary as development progresses.

