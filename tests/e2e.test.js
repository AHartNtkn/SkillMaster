import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { CourseManager } from '../js/services/CourseManager.js';
import { TaskSelector } from '../js/services/TaskSelector.js';
import { SkillMasterApp } from '../js/app.js';

describe('End-to-End Tests', () => {
    let courseManager;
    let taskSelector;

    beforeEach(async () => {
        // Clear localStorage
        localStorage.clear();
        
        // Initialize services
        courseManager = new CourseManager();
        await courseManager.initialize();
        taskSelector = new TaskSelector(courseManager);
    });

    afterEach(() => {
        localStorage.clear();
    });

    test('complete learning flow for a new skill', async () => {
        // Get initial task
        let task = taskSelector.getNextTask();
        expect(task).toBeDefined();
        expect(task.type).toBe('new');
        
        const skillId = task.skillId;
        const skill = courseManager.getSkill(skillId);
        expect(skill).toBeDefined();
        
        // Verify skill starts as unseen
        let skillState = courseManager.masteryState.getSkillState(skillId);
        expect(skillState.status).toBe('unseen');
        
        // Record some attempts
        await courseManager.recordSkillAttempt(skillId, 4); // Good
        skillState = courseManager.masteryState.getSkillState(skillId);
        expect(skillState.status).toBe('in_progress');
        
        await courseManager.recordSkillAttempt(skillId, 5); // Easy
        await courseManager.recordSkillAttempt(skillId, 5); // Easy
        await courseManager.recordSkillAttempt(skillId, 5); // Easy - should trigger mastery
        
        // Check mastery
        skillState = courseManager.masteryState.getSkillState(skillId);
        expect(skillState.status).toBe('mastered');
        expect(courseManager.masteryState.isSkillMastered(skillId)).toBe(true);
        
        // Award XP for completing the quiz (simulates LearningView.endSession)
        courseManager.addXP(10, skillId);
        
        // Verify XP was added
        expect(courseManager.getTotalXP()).toBeGreaterThan(0);
    });

    test('prerequisite flow works correctly', async () => {
        // Find a skill with prerequisites
        let skillWithPrereq = null;
        let prereqSkill = null;
        
        for (const course of courseManager.getAllCourses()) {
            for (const skill of course.getAllSkills()) {
                if (skill.prerequisites.length > 0) {
                    skillWithPrereq = skill;
                    prereqSkill = courseManager.getSkill(skill.prerequisites[0].id);
                    break;
                }
            }
            if (skillWithPrereq) break;
        }
        
        if (!skillWithPrereq) {
            console.log('No skills with prerequisites found, skipping test');
            return;
        }
        
        // Verify the dependent skill is not available initially
        const availableNew = taskSelector.getAvailableNewSkills();
        expect(availableNew).not.toContain(skillWithPrereq.id);
        
        // Master all prerequisites
        for (const prereq of skillWithPrereq.prerequisites) {
            const prereqState = courseManager.masteryState.getSkillState(prereq.id);
            if (prereqState.status !== 'mastered') {
                // Record 3 perfect scores to achieve mastery
                await courseManager.recordSkillAttempt(prereq.id, 5);
                await courseManager.recordSkillAttempt(prereq.id, 5);
                await courseManager.recordSkillAttempt(prereq.id, 5);
            }
        }
        
        // Now the dependent skill should be available
        const availableAfter = taskSelector.getAvailableNewSkills();
        expect(availableAfter).toContain(skillWithPrereq.id);
    });

    test('mixed quiz triggers at XP threshold', async () => {
        // First master some skills
        const skills = [];
        for (const course of courseManager.getAllCourses()) {
            for (const skill of course.getAllSkills()) {
                if (skill.prerequisites.length === 0) {
                    skills.push(skill);
                }
            }
        }
        
        // Master at least one skill to have skills with pending reviews
        if (skills.length > 0) {
            const skillId = skills[0].id;
            await courseManager.recordSkillAttempt(skillId, 5);
            await courseManager.recordSkillAttempt(skillId, 5);
            await courseManager.recordSkillAttempt(skillId, 5);
            
            // Verify the skill now has a review scheduled
            const skillState = courseManager.masteryState.getSkillState(skillId);
            expect(skillState.status).toBe('mastered');
            expect(skillState.next_due).toBeDefined();
            
            // Wait to ensure the skill becomes overdue (mock FSRS schedules ~1 second intervals)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Accumulate enough XP to trigger mixed quiz
            // Award XP for completing the quiz (simulates LearningView.endSession)
            courseManager.addXP(10, skillId);
            // Need 150 total for mixed quiz, we have 10, so need 140 more
            for (let i = 0; i < 14; i++) {
                courseManager.addXP(10, 'test');
            }
            
            expect(courseManager.prefs.xp_since_mixed_quiz).toBeGreaterThanOrEqual(150);
            
            const task = taskSelector.getNextTask();
            // Mixed quiz should be available as a candidate
            const candidates = taskSelector.getCandidates();
            const mixedQuizCandidate = candidates.find(c => c.type === 'mixed_quiz');
            expect(mixedQuizCandidate).toBeDefined();
            
            // Get quiz questions
            const questions = courseManager.assembleMixedQuiz();
            
            // Debug if failing
            if (questions.length === 0) {
                const overdueSkills = courseManager.masteryState.getOverdueSkills();
                console.log('Overdue skills:', overdueSkills);
                console.log('Current time:', new Date().toISOString());
                console.log('Skill state after wait:', courseManager.masteryState.getSkillState(skillId));
                console.log('NODE_ENV:', process.env.NODE_ENV);
            }
            
            expect(questions.length).toBeGreaterThan(0);
            expect(questions.length).toBeLessThanOrEqual(15);
        }
    });

    test('views render without errors when starting tasks', async () => {
        // Import the views
        const { LearningView } = await import('../js/views/LearningView.js');
        const { MixedQuizView } = await import('../js/views/MixedQuizView.js');
        
        const learningView = new LearningView(courseManager);
        const mixedQuizView = new MixedQuizView(courseManager, taskSelector);
        
        // Test that views have render methods
        expect(typeof learningView.render).toBe('function');
        expect(typeof mixedQuizView.render).toBe('function');
        
        // Test that render returns HTML
        const learningHtml = learningView.render();
        const mixedHtml = mixedQuizView.render();
        
        expect(learningHtml).toContain('Loading...');
        expect(mixedHtml).toContain('Loading Mixed Quiz...');
        
        // Test that starting a skill is possible (full DOM testing would require a browser environment)
        const task = taskSelector.getNextTask();
        expect(task).toBeDefined();
        
        // Verify the task structure is correct
        if (task) {
            expect(['new', 'review', 'mixed_quiz']).toContain(task.type);
            if (task.type !== 'mixed_quiz') {
                expect(task.skillId).toBeDefined();
            }
        }
    });

    test('data persistence works correctly', async () => {
        // Make some changes
        const task = taskSelector.getNextTask();
        if (task && task.type === 'new') {
            await courseManager.recordSkillAttempt(task.skillId, 4);
            courseManager.addXP(10, 'test');
        }
        
        const totalXP = courseManager.getTotalXP();
        const prefs = { ...courseManager.prefs };
        
        // Create new instance (simulating app reload)
        const newCourseManager = new CourseManager();
        await newCourseManager.initialize();
        
        // Verify data was persisted
        expect(newCourseManager.getTotalXP()).toBe(totalXP);
        expect(newCourseManager.prefs.last_as).toBe(prefs.last_as);
    });

    test('implicit credit applies to prerequisites', async () => {
        // Find a skill with prerequisites
        let skillWithPrereq = null;
        let prereqSkillId = null;
        
        for (const course of courseManager.getAllCourses()) {
            for (const skill of course.getAllSkills()) {
                if (skill.prerequisites.length > 0) {
                    // Check if prerequisite is already in progress or mastered
                    const prereqState = courseManager.masteryState.getSkillState(skill.prerequisites[0].id);
                    if (prereqState.status === 'unseen') {
                        // First make the prerequisite in progress
                        await courseManager.recordSkillAttempt(skill.prerequisites[0].id, 4);
                    }
                    skillWithPrereq = skill;
                    prereqSkillId = skill.prerequisites[0].id;
                    break;
                }
            }
            if (skillWithPrereq) break;
        }
        
        if (!skillWithPrereq) {
            console.log('No suitable skills with prerequisites found, skipping test');
            return;
        }
        
        // Master the prerequisite first
        await courseManager.recordSkillAttempt(prereqSkillId, 5);
        await courseManager.recordSkillAttempt(prereqSkillId, 5);
        await courseManager.recordSkillAttempt(prereqSkillId, 5);
        
        // Get the prerequisite's next due date
        const prereqStateBefore = courseManager.masteryState.getSkillState(prereqSkillId);
        const dueBefore = new Date(prereqStateBefore.next_due);
        
        // Now practice the dependent skill with a good grade
        await courseManager.recordSkillAttempt(skillWithPrereq.id, 4); // Good grade
        
        // Check that prerequisite got implicit credit
        const prereqStateAfter = courseManager.masteryState.getSkillState(prereqSkillId);
        const dueAfter = new Date(prereqStateAfter.next_due);
        
        // The new due date should be different (and likely sooner due to damping)
        expect(dueAfter.getTime()).not.toBe(dueBefore.getTime());
    });

    test('export and import functionality', async () => {
        // Make some changes
        const task = taskSelector.getNextTask();
        if (task && task.type === 'new') {
            await courseManager.recordSkillAttempt(task.skillId, 5);
        }
        
        // Export data
        const exportedData = courseManager.exportData();
        expect(exportedData).toBeDefined();
        expect(exportedData.mastery).toBeDefined();
        expect(exportedData.prefs).toBeDefined();
        
        // Clear and reimport
        courseManager.resetProgress();
        const success = courseManager.importData(exportedData);
        expect(success).toBe(true);
        
        // Verify data was restored
        if (task && task.type === 'new') {
            const state = courseManager.masteryState.getSkillState(task.skillId);
            expect(state.status).not.toBe('unseen');
        }
    });
});

describe('Learning Flow E2E', () => {
    let app;

    beforeEach(async () => {
        // Clear localStorage and JSDOM document state
        localStorage.clear();
        document.body.innerHTML = ''; // Clear body
        document.head.innerHTML = ''; // Clear head if styles are added there

        // Setup basic HTML structure that the app expects
        document.body.innerHTML = `
            <div id="main-content"></div>
            <div id="tab-bar">
                <div class="tab-item" data-tab="home">Home</div>
                <div class="tab-item" data-tab="progress">Progress</div>
                <div class="tab-item" data-tab="library">Library</div>
                <div class="tab-item" data-tab="settings">Settings</div>
            </div>
        `;

        app = new SkillMasterApp();
        // Note: app.initialize() will be called at the start of the test case
        // to allow for specific mocks or spies to be set up beforehand if needed.
    });

    afterEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        vi.restoreAllMocks(); // Restore all mocks after each test
    });

    test('should complete a question, rate it, and advance without FSRS errors', async () => {
        // 1. Initialize App and navigate to a skill
        await app.initialize();
        const skillId = 'EA:AS001'; // Assuming this skill and its questions exist
        app.showView('learning');
        await app.views.learning.startSkill(skillId);

        // Wait for question to be displayed (simulate async rendering if any)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Spy on console.error to catch FSRS errors
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // 2. Simulate answering a question
        // Ensure question is loaded
        expect(app.views.learning.questions.length).toBeGreaterThan(0);
        const initialQuestionIndex = app.views.learning.currentQuestionIndex;

        // Set up DOM structure needed for feedback display
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<div class="choices-list"></div>';
        }
        
        app.views.learning.selectAnswer(0); // Select first choice
        app.views.learning.submitAnswer();

        // Wait for feedback/rating to be displayed
        await new Promise(resolve => setTimeout(resolve, 100));

        // 3. Simulate rating the answer (e.g., grade 4 "Okay")
        await app.views.learning.rateAndContinue(4);

        // Wait for next question or session end to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // 4. Assertions
        // Check that no FSRS-related errors were logged
        consoleErrorSpy.mock.calls.forEach(call => {
            if (call[0] && typeof call[0] === 'string') {
                expect(call[0]).not.toContain('Failed to import FSRS');
                expect(call[0]).not.toContain('resolve module specifier \'fsrs.js\'');
            }
        });

        // Check if the question index advanced or session ended
        const skillState = app.courseManager.masteryState.getSkillState(skillId);
        if (app.views.learning.shouldEndSession()) {
            // If session ended, check if UI reflects this (e.g., shows session complete)
            expect(document.getElementById('main-content').innerHTML).toContain('Session Complete');
        } else {
            // If session continues, check if question index changed
            expect(skillState.next_q_index).not.toBe(initialQuestionIndex);
            expect(app.views.learning.currentQuestionIndex).not.toBe(initialQuestionIndex);
        }

        // Clean up spy
        consoleErrorSpy.mockRestore();
    });
});