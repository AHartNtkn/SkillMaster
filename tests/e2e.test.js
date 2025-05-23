import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { CourseManager } from '../js/services/CourseManager.js';
import { TaskSelector } from '../js/services/TaskSelector.js';

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
        
        // Master the prerequisite
        await courseManager.recordSkillAttempt(prereqSkill.id, 5);
        await courseManager.recordSkillAttempt(prereqSkill.id, 5);
        await courseManager.recordSkillAttempt(prereqSkill.id, 5);
        
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
        
        // Master at least one skill
        if (skills.length > 0) {
            const skillId = skills[0].id;
            await courseManager.recordSkillAttempt(skillId, 5);
            await courseManager.recordSkillAttempt(skillId, 5);
            await courseManager.recordSkillAttempt(skillId, 5);
            
            // Manually set XP to trigger mixed quiz
            courseManager.prefs.xp_since_mixed_quiz = 150;
            courseManager.saveState();
            
            const task = taskSelector.getNextTask();
            expect(task.type).toBe('mixed_quiz');
            
            // Get quiz questions
            const questions = taskSelector.selectMixedQuizQuestions();
            expect(questions.length).toBeGreaterThan(0);
            expect(questions.length).toBeLessThanOrEqual(15);
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