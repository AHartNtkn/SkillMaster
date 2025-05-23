import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { CourseManager } from '../js/services/CourseManager.js';
import { TaskSelector } from '../js/services/TaskSelector.js';

describe('Integration Tests (without FSRS)', () => {
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

    test('task selection prioritizes correctly', () => {
        // Test without FSRS - just verify task selection logic
        
        // Initially should get a new task (first skill with no prereqs)
        const firstTask = taskSelector.getNextTask();
        expect(firstTask).toBeDefined();
        expect(firstTask.type).toBe('new');
        
        // Verify it's a skill with no prerequisites
        const skill = courseManager.getSkill(firstTask.skillId);
        expect(skill).toBeDefined();
        expect(skill.prerequisites.length).toBe(0);
    });

    test('course loading works correctly', () => {
        const courses = courseManager.getAllCourses();
        expect(courses.length).toBeGreaterThan(0);
        
        const course = courses[0];
        expect(course.courseId).toBe('elementary_arithmetic');
        expect(course.title).toBe('Elementary Arithmetic');
        
        const skills = course.getAllSkills();
        expect(skills.length).toBe(4); // Based on the seed data
        
        const topics = course.getAllTopics();
        expect(topics.length).toBe(2);
    });

    test('mastery state tracking works', () => {
        const skillId = 'EA:AS001';
        
        // Initial state should be unseen
        let state = courseManager.masteryState.getSkillState(skillId);
        expect(state.status).toBe('unseen');
        
        // Update state
        courseManager.masteryState.updateSkillState(skillId, {
            status: 'in_progress',
            next_q_index: 1
        });
        
        state = courseManager.masteryState.getSkillState(skillId);
        expect(state.status).toBe('in_progress');
        expect(state.next_q_index).toBe(1);
    });

    test('attempt window tracks attempts correctly', () => {
        const skillId = 'EA:AS001';
        
        // Add attempts
        courseManager.attemptWindow.addSkillAttempt(skillId, 3);
        courseManager.attemptWindow.addSkillAttempt(skillId, 4);
        courseManager.attemptWindow.addSkillAttempt(skillId, 5);
        
        const attempts = courseManager.attemptWindow.getSkillAttempts(skillId);
        expect(attempts).toEqual([3, 4, 5]);
        
        // Test mastery criteria
        expect(courseManager.attemptWindow.checkMasteryCriteria(skillId)).toBe(false);
        
        // Add more grade 5s
        courseManager.attemptWindow.addSkillAttempt(skillId, 5);
        courseManager.attemptWindow.addSkillAttempt(skillId, 5);
        
        expect(courseManager.attemptWindow.checkMasteryCriteria(skillId)).toBe(true);
    });

    test('XP tracking works correctly', () => {
        expect(courseManager.getTotalXP()).toBe(0);
        
        courseManager.addXP(10, 'test1');
        expect(courseManager.getTotalXP()).toBe(10);
        expect(courseManager.prefs.xp_since_mixed_quiz).toBe(10);
        
        courseManager.addXP(20, 'test2');
        expect(courseManager.getTotalXP()).toBe(30);
        expect(courseManager.prefs.xp_since_mixed_quiz).toBe(30);
        
        courseManager.resetMixedQuizXP();
        expect(courseManager.getTotalXP()).toBe(30); // Total unchanged
        expect(courseManager.prefs.xp_since_mixed_quiz).toBe(0); // Reset
    });

    test('question loading works', async () => {
        const questions = await courseManager.getSkillQuestions('EA:AS001');
        expect(questions).toBeDefined();
        expect(questions.length).toBeGreaterThan(0);
        
        const firstQuestion = questions[0];
        expect(firstQuestion.stem).toBeDefined();
        expect(firstQuestion.choices).toBeDefined();
        expect(firstQuestion.choices.length).toBe(4);
        expect(typeof firstQuestion.correct).toBe('number');
    });

    test('skill explanation loading works', async () => {
        const explanation = await courseManager.getSkillExplanation('EA:AS001');
        expect(explanation).toBeDefined();
        expect(typeof explanation).toBe('string');
        expect(explanation.length).toBeGreaterThan(0);
        expect(explanation).toContain('#'); // Should have markdown headers
    });

    test('data persistence works', () => {
        // Make changes
        courseManager.addXP(50, 'test');
        courseManager.prefs.ui_theme = 'dark';
        courseManager.masteryState.updateSkillState('EA:AS001', {
            status: 'in_progress'
        });
        courseManager.saveState();
        
        // Create new instance
        const newCourseManager = new CourseManager();
        newCourseManager.initialize();
        
        // Verify persistence
        expect(newCourseManager.getTotalXP()).toBe(50);
        expect(newCourseManager.prefs.ui_theme).toBe('dark');
        expect(newCourseManager.masteryState.getSkillState('EA:AS001').status).toBe('in_progress');
    });

    test('available new skills calculation', () => {
        // Initially, only skills with no prerequisites should be available
        let available = taskSelector.getAvailableNewSkills();
        
        // EA:AS001 and EA:AS003 have no prerequisites
        expect(available).toContain('EA:AS001');
        expect(available).toContain('EA:AS003');
        
        // EA:AS004 and EA:AS013 have prerequisites, so shouldn't be available
        expect(available).not.toContain('EA:AS004');
        expect(available).not.toContain('EA:AS013');
        
        // Master EA:AS001
        courseManager.masteryState.updateSkillState('EA:AS001', {
            status: 'mastered'
        });
        
        available = taskSelector.getAvailableNewSkills();
        
        // Now EA:AS004 should be available (depends on EA:AS001)
        expect(available).toContain('EA:AS004');
    });

    test('course validation detects issues', () => {
        const course = courseManager.getCourse('elementary_arithmetic');
        expect(course).toBeDefined();
        
        const validation = course.validate();
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });
});