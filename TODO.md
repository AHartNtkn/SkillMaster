# TODO

This document lists the outstanding work required to implement the project according to `docs/design_doc.md`.

1. **Filesystem persistence**
   - Implement `save/` directory with `mastery.json`, `attempt_window.json`, `xp.json` and `prefs.json`.
   - Replace `localStorage` usage with file based persistence through the Tauri filesystem API.
2. **SQLite cache and loader**
   - Create `.cache/index.db` containing `topic`, `edge`, `as_count` and `dist` tables.
   - Build or update the cache when course folders change and compute all‑pairs distances using Floyd–Warshall.
   - Demand‑load topics and prerequisites from course folders using this cache.
3. **Scheduling engine**
   - Implement task selection from overdue reviews, new skills whose prerequisites are mastered, and mixed‑quiz tasks when `xp_since_mixed_quiz` reaches the trigger.
   - Apply the priority formula (`base + overdue_bonus + foundational_gap_bonus + distance_bonus`) including the non‑interference guard (`review_gap_min_m`).
4. **Mixed quiz system**
   - Assemble a 15‑question mixed quiz when triggered.
   - Choose mastered skills with last attempt ≤ 30 days weighted by days overdue.
   - Cycle deterministically through each skill’s `next_q_index` and update mastery after submission; reset `xp_since_mixed_quiz`.
5. **Autosave and error handling**
   - Autosave progress to the `save/` files after every answer using atomic write and retry with exponential back‑off.
   - Show a toast after three consecutive failures.
   - Log malformed course files to `logs/error.log` and skip scheduling those skills.
6. **Content availability handling**
   - When Markdown or YAML content is missing, display “Content unavailable” but continue scheduling the skill.
7. **Topic unlock rule**
   - Unlock a topic only after all prerequisite topics are mastered and add its first skill to the candidate pool as `new_as`.
8. **UI updates and terminology**
   - Ensure all learner‑facing text refers to “Skill” rather than “AS”.
   - Implement remaining screens for progress, library and settings as described, following accessibility and i18n guidelines.
9. **Schema validation**
   - Add AJV 8 validation for `topic-v1.json`, `catalog-v1.json`, `asq-v1.json`, `mastery-v2.json`, `attempts-v1.json` and `prefs-v1.json` during the build.
10. **Profiles and logging**
    - Support multiple learner profiles under `profiles/<name>/` with the active profile recorded in `prefs.json`.
    - Add rotating `logs/debug.log` in development builds.
11. **Versioning and migration support**
    - Run migration scripts when older save formats are detected and back up originals to `backup_YYYYMMDD/`.
12. **Export, import and reset**
    - Export progress as a zip of the `save/` directory.
    - Reset a course by moving the profile to `archive/<timestamp>/` and seeding new blank files.
    - Reject imported bundles with newer format versions.
13. **Security and packaging**
    - Enforce the content security policy defined in the design doc.
    - Configure CI to produce signed Windows, Linux and Android binaries.
14. **Performance limits**
    - Limit in‑memory graph to 500 recent nodes plus two‑hop prerequisites and cap stored distance matrix to 1000×1000 entries.
15. **Additional automated tests**
    - Cover the QA checklist: first‑run sample course, FSRS interval growth, implicit prerequisite credit, mixed quiz trigger, non‑interference gap, hot‑reload of JSON edits and crash‑recovery of autosave.

