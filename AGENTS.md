# AGENTS.md

This file provides guidance for agents working with the SkillMaster codebase. It documents the project structure, code patterns, testing expectations, and key implementation details.

## Project Overview

SkillMaster is a fully offline, single-learner application implementing adaptive, knowledge-graph-based pedagogy with:
- Spaced Repetition System (SRS) using FSRS-5
- Prerequisite-aware lessons and implicit prerequisite credit
- Non-interference task ordering and cross-course remediation
- Periodic mixed quizzes
- Complete offline operation with JSON/YAML data storage

## Architecture Overview

**Pattern**: MVC-like with Service Layer
- **Entry Point**: `index.html` → `js/app.js` (SkillMasterApp class)
- **Services**: Business logic and data management
- **Views**: UI components with render() and attachEventListeners() methods
- **Models**: Data structures and domain objects
- **Single Page Application**: Tab-based navigation, Progressive Web App

## Directory Structure and Key Files

```
/home/ahart/Documents/SkillMaster/
├── js/                          # Main application code
│   ├── app.js                   # 🔑 Main SkillMasterApp class
│   ├── services/                # 🔑 Business logic layer
│   │   ├── CourseManager.js     # 🔑 Central service for all operations
│   │   ├── TaskSelector.js      # 🔑 Task selection algorithm
│   │   ├── fsrs.js              # 🔑 FSRS spaced repetition wrapper
│   │   └── storage.js           # File I/O and persistence
│   ├── views/                   # UI components
│   │   ├── HomeView.js          # Dashboard
│   │   ├── LearningView.js      # 🔑 Skill learning sessions
│   │   ├── MixedQuizView.js     # Mixed review quizzes
│   │   ├── ProgressView.js      # Knowledge graph (D3.js)
│   │   ├── LibraryView.js       # Course catalog
│   │   └── SettingsView.js      # App preferences
│   ├── models/                  # Data models
│   │   ├── Course.js            # 🔑 Core domain models
│   │   ├── MasteryState.js      # 🔑 FSRS scheduling state
│   │   └── AttemptWindow.js     # Recent attempt history
│   ├── controllers/             # (Empty - logic in services/views)
│   └── utils/                   # Utility functions
├── course/                      # 🔑 Course content and data
│   └── EA/                      # Elementary Arithmetic course
│       ├── catalog.json         # Course metadata
│       ├── topics/              # Topic definitions (JSON)
│       ├── skills/              # Atomic skill definitions (JSON)
│       ├── as_md/              # Skill explanations (Markdown)
│       └── as_questions/        # Question pools (YAML)
├── save/                        # 🔑 User progress (runtime, not in git)
├── tests/                       # 🔑 Test suite
├── css/main.css                 # Styles with CSS custom properties
├── package.json                 # Dependencies and scripts
└── vitest.config.js            # Test configuration
```

🔑 = Critical files to understand when making changes

## Core Services (js/services/)

### CourseManager.js
**Role**: Central coordinator for all course-related operations
**Key Methods**:
- `initialize()`: Load courses, mastery state, preferences
- `recordSkillAttempt(skillId, grade)`: Update FSRS and check mastery
- `saveState()`: Persist all state to save/ directory
- `getSkill(id)`, `getTopic(id)`: Data access
- `loadCourse(courseId)`: Dynamic course loading

**State Management**: Manages mastery state, attempt windows, preferences, XP log

### TaskSelector.js
**Role**: Implements priority-based task selection algorithm
**Key Methods**:
- `getNextTask()`: Returns highest priority task
- `calculatePriority(task)`: Scoring algorithm with bonuses
- `checkNonInterference()`: Prevents same-topic consecutive tasks

**Priority Formula**: `base + overdue_bonus + foundational_gap_bonus + distance_bonus`

### fsrs.js
**Role**: Wraps FSRS algorithm for spaced repetition scheduling
**Key Methods**:
- `scheduleReview(grade, currentState)`: Calculate next review date
- `applyImplicitCredit(mainSkill, prereqSkill)`: Prerequisite credit system

### storage.js
**Role**: File I/O and data persistence
**Key Methods**:
- `saveToLocal()`, `loadFromLocal()`: localStorage operations
- `saveJSON()`, `loadJSON()`: File system operations (atomic saves)

## Data Models (js/models/)

### Course.js
- `Course`: Container with topics and skills
- `Topic`: Collection of atomic skills
- `AtomicSkill`: Smallest learning unit with prerequisites

**File Naming Convention**: All IDs map directly to file paths
- Skills: `{course_id}_AS{number}.json` → `EA_AS001.json`
- Topics: `{course_id}_T{number}.json` → `EA_T001.json`

### MasteryState.js
- `MasteryState`: FSRS scheduling state for all skills/topics
- `SkillState`: Individual skill FSRS parameters (s, d, r, l, next_due)

### AttemptWindow.js
- Tracks recent grades for mastery calculation
- Mastery: ≥3 attempts with last 3 grades all being 5 (Easy)

## View Architecture (js/views/)

**Pattern**: Each view class has `render()` and `attachEventListeners()` methods
**Coordination**: Views are managed by main `SkillMasterApp` class
**Navigation**: Tab-based with bottom navigation bar

### LearningView.js (Critical)
**Phases**:
1. **Exposition**: Display Markdown content for skill
2. **Question**: Present multiple-choice questions
3. **Feedback**: Show correct/incorrect and solution
4. **Self-Rating**: FSRS difficulty rating (Again/Hard/Okay/Easy)

**Key Methods**:
- `startSkill(skillId)`: Initialize learning session
- `showQuestion()`: Display current question
- `submitAnswer()`: Handle answer submission
- `showRating()`: Display FSRS self-rating buttons

## Testing Framework and Patterns

**Framework**: Vitest (migrated from Jest)
**Configuration**: `vitest.config.js`
**Environment**: jsdom for DOM testing
**Setup**: `tests/setup.js` with global fetch mock

### Test Structure
```
tests/
├── __mocks__/
│   └── fsrs.js              # Mock FSRS with deterministic scheduling
├── e2e.test.js              # End-to-end user flows
├── models.test.js           # Data model unit tests
├── services/                # Service layer tests
├── views/                   # View component tests
└── *.test.js               # Various test categories
```

### Testing Patterns

**Mocking Strategy**:
- FSRS.js mocked via vitest alias (`vitest.config.js`)
- Global fetch mocked for file loading (`tests/setup.js`)
- Fast scheduling in tests (seconds instead of days)

**Test Categories**:
- **Unit Tests**: Individual classes and methods
- **Integration Tests**: Service interactions
- **End-to-End Tests**: Complete user workflows

**Example Test Structure**:
```javascript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('Component Name', () => {
    beforeEach(() => {
        localStorage.clear();
        // Setup test data
    });

    test('should do something specific', async () => {
        // Arrange, Act, Assert
    });
});
```

**Mock FSRS Behavior**:
- Easy rating: ~1 second until next due (for testing)
- Good rating: ~0.6 seconds until next due
- Hard rating: ~0.4 seconds until next due
- Again rating: ~0.25 seconds until next due

## Code Style and Conventions

### JavaScript
- **ES6 modules**: `import`/`export` with `type: "module"`
- **Classes**: PascalCase class names, constructor pattern
- **Async/await**: For asynchronous operations
- **Error handling**: Try/catch with appropriate logging

### File Naming
- **Classes**: PascalCase (e.g., `CourseManager.js`)
- **Services**: camelCase (e.g., `storage.js`)
- **Data files**: Snake_case with course prefix (e.g., `EA_AS001.json`)

### Architecture Principles
- **Separation of concerns**: Services handle logic, views handle UI
- **Centralized state**: CourseManager coordinates all state
- **Event-driven**: User interactions trigger service methods
- **Modular design**: Easy to test individual components

## Data Formats and Storage

### File Structure Conventions
- **Course ID**: Must match directory name and catalog.json course_id
- **Skill Files**: `skills/EA_AS001.json` (underscores replace colons)
- **Topic Files**: `topics/EA_T001.json`
- **Markdown**: `as_md/EA_AS001.md`
- **Questions**: `as_questions/EA_AS001.yaml`

### Key Data Files
- `courses.json`: Registry of available courses
- `course/{id}/catalog.json`: Course metadata
- `save/mastery.json`: FSRS state for all skills/topics
- `save/prefs.json`: User preferences and session state
- `save/attempt_window.json`: Recent grades for mastery tracking
- `save/xp.json`: Experience point transaction log

## Development Workflow

### Running the Application
```bash
npm run dev          # Start development server (Python HTTP server)
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI interface
```

### Adding New Features
1. **Services**: Add business logic to appropriate service class
2. **Models**: Create/extend data models if needed
3. **Views**: Add UI components with render/attachEventListeners pattern
4. **Tests**: Write unit, integration, and e2e tests
5. **Data**: Add course content following naming conventions

### Testing New Features
1. **Unit tests**: Test individual methods in isolation
2. **Integration tests**: Test service interactions
3. **E2E tests**: Test complete user workflows
4. **Mock appropriately**: Use FSRS mock for deterministic testing

## Common Patterns and Anti-Patterns

### ✅ Good Patterns
- Use `CourseManager` for all state operations
- Follow render() → attachEventListeners() pattern in views
- Mock external dependencies (FSRS) in tests
- Use atomic saves for data persistence
- Follow the existing file naming conventions

### ❌ Anti-Patterns
- Don't bypass CourseManager for state changes
- Don't hardcode course content or IDs
- Don't use `window.confirm()` (use custom confirmation dialogs)
- Don't implement FSRS algorithm directly (use the service wrapper)
- Don't create files outside the established conventions

## Key Implementation Details

### FSRS Integration
- Real FSRS.js library in production
- Mock FSRS in tests with fast scheduling
- Implicit prerequisite credit system for advanced skills
- Grade mapping: Incorrect=1, Again=2, Hard=3, Okay=4, Easy=5

### Task Selection Algorithm
- Priority-based with multiple factors
- Non-interference rules (minimum 10 minutes between same topic)
- Mixed quiz trigger at 150 XP
- Overdue bonus increases with days overdue

### Mastery Criteria
- Requires ≥3 attempts with last 3 grades all being 5 (Easy)
- Topics are mastered when all constituent skills are mastered
- Status progression: unseen → in_progress → mastered

## Known Issues and Limitations

From the audit in CLAUDE.md:
1. **Custom confirmation dialogs**: Currently using `window.confirm()`
2. **Topic mastery status**: Not automatically updated when skills are mastered
3. **Graph distance cache**: Not implemented (computed on-demand)
4. **Question progress display**: Missing "X of Y" format
5. **Hardcoded application version**: Should be dynamic

## Testing Expectations

### Required Test Coverage
- **All new services**: Unit tests for public methods
- **All new views**: Rendering and interaction tests
- **All new models**: Constructor and method tests
- **Critical flows**: E2E tests for user workflows

### Test Quality Standards
- **Isolation**: Each test should be independent
- **Clear assertions**: Use descriptive expect statements
- **Proper setup/teardown**: Clean localStorage between tests
- **Mock appropriately**: Use provided mocks for external dependencies

### Running Tests
Always run the full test suite before committing:
```bash
npm run test
```

For development, use watch mode:
```bash
npm run test:watch
```

This documentation provides the foundation for understanding and extending the SkillMaster codebase. When in doubt, refer to the existing patterns and test implementations.