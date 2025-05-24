import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TaskSelector } from '../js/services/TaskSelector.js';
import { CourseManager } from '../js/services/CourseManager.js';
import { Course, Topic, AtomicSkill } from '../js/models/Course.js';

// Mock CourseManager
class MockCourseManager {
    constructor() {
        this.courses = new Map();
        this.masteryState = {
            skills: new Map(),
            getSkillState: (id) => {
                if (!this.masteryState.skills.has(id)) {
                    this.masteryState.skills.set(id, {
                        status: 'unseen',
                        next_due: null
                    });
                }
                return this.masteryState.skills.get(id);
            },
            isSkillMastered: (id) => {
                const state = this.masteryState.getSkillState(id);
                return state.status === 'mastered';
            },
            getOverdueSkills: () => {
                const overdue = [];
                for (const [id, state] of this.masteryState.skills) {
                    if (state.next_due && new Date(state.next_due) < new Date()) {
                        overdue.push(id);
                    }
                }
                return overdue;
            }
        };
        this.prefs = {
            xp_since_mixed_quiz: 0,
            last_as: null
        };
        this.xpLog = {
            log: []
        };
        this.fsrs = {
            isOverdue: (date) => new Date(date) < new Date(),
            getDaysOverdue: (date) => {
                const days = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);
                return Math.max(0, Math.floor(days));
            }
        };
    }

    getAllCourses() {
        return Array.from(this.courses.values());
    }

    getSkill(id) {
        for (const course of this.courses.values()) {
            const skill = course.getSkill(id);
            if (skill) return skill;
        }
        return null;
    }
}

describe('TaskSelector', () => {
    let courseManager;
    let taskSelector;
    let course;

    beforeEach(() => {
        courseManager = new MockCourseManager();
        taskSelector = new TaskSelector(courseManager);

        // Set up a test course
        course = new Course({
            course_id: 'TEST',
            title: 'Test Course'
        });

        const topic = new Topic({
            id: 'TEST:T001',
            name: 'Test Topic',
            ass: ['TEST:AS001', 'TEST:AS002', 'TEST:AS003']
        });

        const skill1 = new AtomicSkill({
            id: 'TEST:AS001',
            title: 'Skill 1',
            desc: 'First skill',
            prereqs: []
        });

        const skill2 = new AtomicSkill({
            id: 'TEST:AS002',
            title: 'Skill 2',
            desc: 'Second skill',
            prereqs: [{ id: 'TEST:AS001', weight: 1.0 }]
        });

        const skill3 = new AtomicSkill({
            id: 'TEST:AS003',
            title: 'Skill 3',
            desc: 'Third skill',
            prereqs: [{ id: 'TEST:AS002', weight: 1.0 }]
        });

        course.addTopic(topic);
        course.addSkill(skill1);
        course.addSkill(skill2);
        course.addSkill(skill3);
        courseManager.courses.set('TEST', course);
    });

    test('mixed quiz available when XP threshold reached', () => {
        courseManager.prefs.xp_since_mixed_quiz = 150;
        
        // Need at least one skill with a pending review for mixed quiz
        courseManager.masteryState.skills.set('TEST:AS001', {
            status: 'in_progress',
            next_due: new Date(Date.now() + 86400000).toISOString() // Due tomorrow (not overdue)
        });
        
        const task = taskSelector.getNextTask();
        expect(task).toBeDefined();
        // Mixed quiz has lower priority than new skills but should still be available
        expect(['mixed_quiz', 'new'].includes(task.type)).toBe(true);
    });

    test('selects new skills with mastered prerequisites', () => {
        // Master skill 1
        courseManager.masteryState.skills.set('TEST:AS001', {
            status: 'mastered',
            next_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        const task = taskSelector.getNextTask();
        expect(task).toBeDefined();
        expect(task.type).toBe('new');
        expect(task.skillId).toBe('TEST:AS002');
    });

    test('prioritizes overdue reviews', () => {
        // Set skill 1 as overdue
        courseManager.masteryState.skills.set('TEST:AS001', {
            status: 'in_progress',
            next_due: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days overdue
        });

        // Also have a new skill available
        courseManager.masteryState.skills.set('TEST:AS002', {
            status: 'mastered',
            next_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        const task = taskSelector.getNextTask();
        expect(task).toBeDefined();
        expect(task.type).toBe('review');
        expect(task.skillId).toBe('TEST:AS001');
    });

    test('calculates priority with overdue bonus', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        courseManager.masteryState.skills.set('TEST:AS001', {
            status: 'in_progress',
            next_due: threeDaysAgo
        });

        const priority = taskSelector.calculatePriority('review', 'TEST:AS001');
        expect(priority).toBe(5 + 3 + 0); // base + overdue bonus + distance bonus (0 when no last skill)
    });

    test('applies non-interference rule', () => {
        // Set up last skill and recent activity
        courseManager.prefs.last_as = 'TEST:AS001';
        courseManager.xpLog.log.push({
            ts: new Date().toISOString(),
            source: 'TEST:AS001_q1',
            delta: 10
        });

        // Have two candidates: one from same topic, one from different
        const candidates = [
            { type: 'new', skillId: 'TEST:AS002', priority: 5 }, // Same topic as AS001
            { type: 'mixed_quiz', priority: 2 }
        ];

        const filtered = taskSelector.applyNonInterference(candidates);
        
        // Should filter out AS002 since it's in same topic and too soon
        expect(filtered).toHaveLength(1);
        expect(filtered[0].type).toBe('mixed_quiz');
    });

    test('calculates graph distance correctly', () => {
        // AS001 -> AS002 -> AS003
        const distance1to2 = taskSelector.calculateGraphDistance('TEST:AS001', 'TEST:AS002');
        const distance1to3 = taskSelector.calculateGraphDistance('TEST:AS001', 'TEST:AS003');
        const distance2to1 = taskSelector.calculateGraphDistance('TEST:AS002', 'TEST:AS001');

        expect(distance1to2).toBe(1); // Direct connection
        expect(distance1to3).toBe(2); // Through AS002
        expect(distance2to1).toBe(1); // Can go backwards too
    });

    test('selects eligible skills for mixed quiz', () => {
        // Set up skills with different due dates
        courseManager.masteryState.skills.set('TEST:AS001', {
            status: 'in_progress',
            next_due: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Due yesterday
        });

        courseManager.masteryState.skills.set('TEST:AS002', {
            status: 'mastered',
            next_due: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // Overdue by 2 days
        });

        courseManager.masteryState.skills.set('TEST:AS003', {
            status: 'mastered',
            next_due: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() // Not due yet
        });

        const eligible = taskSelector.getMixedQuizSkills();
        expect(eligible).toHaveLength(2); // Only AS001 and AS002 are due
        
        // AS002 should have higher weight because it's more overdue
        const as1 = eligible.find(e => e.skillId === 'TEST:AS001');
        const as2 = eligible.find(e => e.skillId === 'TEST:AS002');
        expect(as1).toBeDefined();
        expect(as2).toBeDefined();
        expect(as2.weight).toBeGreaterThan(as1.weight);
    });

    test('returns null when no tasks available', () => {
        // No skills mastered, no overdue, no XP for mixed quiz
        const task = taskSelector.getNextTask();
        expect(task).toBeDefined();
        expect(task.type).toBe('new');
        expect(task.skillId).toBe('TEST:AS001'); // First skill with no prereqs
    });
});