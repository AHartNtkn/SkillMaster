# TODO

High-level tasks required to implement the complete application as described in `docs/design_doc.md`.
This list should be kept up to date.  When a task is finished, remove it from this
file before committing.

## Core Data & Storage
- [ ] Implement filesystem layout (`courses.json`, `course/<id>/`, `save/`, `.cache/`, etc.).
- [ ] Build loader that demand-loads topic and skill files and automatically rebuilds `.cache/index.db` with distance matrix (Floyd–Warshall).
- [ ] Support optional multi-profile folders as per `prefs.json` section.

## Course Content

## Scheduling Engine
- [ ] Update `mastery.json` according to FSRS‑5 and implicit prerequisite credit.
- [ ] Implement candidate pool generation and priority formula (overdue, new AS, mixed quiz).
- [ ] Enforce non‑interference gap between tasks and mixed quiz trigger at 150 XP.
- [ ] Assemble mixed quizzes of mastered ASs with deterministic question cycling.

## UI
- [ ] Implement lesson flow: exposition → questions → feedback with FSRS rating.
- [ ] Provide mixed‑quiz player UI and XP progress indicators.

## Backend (Tauri)
- [ ] Expose file system access and scheduling commands to the frontend via Tauri.
- [ ] Implement crash‑safe data writes and error handling dialogs.

## Testing & QA
- [ ] Add end‑to‑end tests covering lesson progression and mixed quiz trigger.
- [ ] Ensure `npm test` runs all tests and `npm run dev` starts without console errors.

## Packaging & Misc
- [ ] Implement export/import of progress and course reset features.
- [ ] Add migration framework for save data format versions.
# Additional tasks identified during comparison with docs/design_doc.md
- [ ] Enforce topic unlock rule when all prerequisite topics are mastered.
- [ ] Support hot-reloading of JSON edits without restarting the app.
- [ ] Implement cross-course remediation scheduling when prerequisites from other courses are overdue.
- [ ] Cap in-memory distance matrix to 1000x1000 entries and compute others on demand.
