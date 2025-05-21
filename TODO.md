# TODO

High-level tasks required to implement the complete application as described in `docs/design_doc.md`.
This list should be kept up to date.  When a task is finished, remove it from this
file before committing.

## Core Data & Storage
- [ ] Implement filesystem layout (`courses.json`, `course/<id>/`, `save/`, `.cache/`, etc.).
- [ ] Build loader that demand-loads topic and skill files and automatically rebuilds `.cache/index.db` with distance matrix (Floyd–Warshall).
- [ ] Define JSON schemas in `schema/` and validate content and save files via AJV.
- [ ] Implement persistence of save data (`mastery.json`, `attempt_window.json`, `xp.json`, `prefs.json`) with atomic writes and autosave after every answer.
- [ ] Support optional multi-profile folders as per `prefs.json` section.
- [ ] Provide logging to `logs/error.log` and `logs/debug.log` with rotation.

## Course Content
- [ ] Create a sample course with the four provided skills and prerequisite edges.
- [ ] Ensure Markdown explanations and YAML question pools follow conventions.

## Scheduling Engine
- [ ] Integrate `ts-fsrs` and implement grade mapping (incorrect=1, default 4, etc.).
- [ ] Update `mastery.json` according to FSRS‑5 and implicit prerequisite credit.
- [ ] Implement candidate pool generation and priority formula (overdue, new AS, mixed quiz).
- [ ] Enforce non‑interference gap between tasks and mixed quiz trigger at 150 XP.
- [ ] Assemble mixed quizzes of mastered ASs with deterministic question cycling.

## UI
- [ ] Build React components matching `docs/mockup.html` for Home, Learning, Progress, Library, and Settings screens.
- [ ] Implement lesson flow: exposition → questions → feedback with FSRS rating.
- [ ] Provide mixed‑quiz player UI and XP progress indicators.
- [ ] Add dark mode toggle and i18n string loading.

## Backend (Tauri)
- [ ] Expose file system access and scheduling commands to the frontend via Tauri.
- [ ] Implement crash‑safe data writes and error handling dialogs.

## Testing & QA
- [ ] Set up Vitest and React Testing Library; create tests for loaders, schemas, and UI flows.
- [ ] Add end‑to‑end tests covering lesson progression and mixed quiz trigger.
- [ ] Ensure `npm test` runs all tests and `npm run dev` starts without console errors.

## Packaging & Misc
- [ ] Implement export/import of progress and course reset features.
- [ ] Enforce CSP and sanitise Markdown with DOMPurify and MathJax rendering.
- [ ] Add migration framework for save data format versions.
