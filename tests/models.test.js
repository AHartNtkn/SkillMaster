import { describe, test, expect, beforeEach } from 'vitest';
import { Course, Topic, AtomicSkill } from '../js/models/Course.js';
import { MasteryState, SkillState } from '../js/models/MasteryState.js';
import { AttemptWindow } from '../js/models/AttemptWindow.js';

describe('Course Models', () => {
    describe('AtomicSkill', () => {
        test('creates skill with new format', () => {
            const skillData = {
                id: 'TEST:AS001',
                title: 'Test Skill',
                desc: 'Test description',
                prereqs: [
                    { id: 'TEST:AS000', weight: 0.8 }
                ]
            };

            const skill = new AtomicSkill(skillData);
            expect(skill.id).toBe('TEST:AS001');
            expect(skill.title).toBe('Test Skill');
            expect(skill.desc).toBe('Test description');
            expect(skill.prerequisites).toHaveLength(1);
            expect(skill.prerequisites[0].id).toBe('TEST:AS000');
            expect(skill.prerequisites[0].weight).toBe(0.8);
        });

        test('handles old format with name field', () => {
            const skillData = {
                id: 'TEST:AS001',
                name: 'Test Skill',
                prereqs: ['TEST:AS000'],
                weights: { 'TEST:AS000': 0.8 }
            };

            const skill = new AtomicSkill(skillData);
            expect(skill.title).toBe('Test Skill');
            expect(skill.desc).toBe('Test Skill'); // Falls back to name
            expect(skill.prerequisites).toHaveLength(1);
            expect(skill.prerequisites[0].id).toBe('TEST:AS000');
            expect(skill.prerequisites[0].weight).toBe(0.8);
        });
    });

    describe('Course', () => {
        let course;

        beforeEach(() => {
            course = new Course({
                format: 'Catalog-v1',
                course_id: 'TEST',
                title: 'Test Course'
            });
        });

        test('validates course structure', () => {
            const topic = new Topic({
                id: 'TEST:T001',
                name: 'Test Topic',
                ass: ['TEST:AS001']
            });

            const skill = new AtomicSkill({
                id: 'TEST:AS001',
                title: 'Test Skill',
                desc: 'Test',
                prereqs: []
            });

            course.addTopic(topic);
            course.addSkill(skill);

            const validation = course.validate();
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });


        test('detects prerequisite cycles', () => {
            const skill1 = new AtomicSkill({
                id: 'TEST:AS001',
                title: 'Skill 1',
                desc: 'Test',
                prereqs: [{ id: 'TEST:AS002', weight: 1 }]
            });

            const skill2 = new AtomicSkill({
                id: 'TEST:AS002',
                title: 'Skill 2',
                desc: 'Test',
                prereqs: [{ id: 'TEST:AS001', weight: 1 }]
            });

            course.addSkill(skill1);
            course.addSkill(skill2);

            const cycleCheck = course.checkForCycles();
            expect(cycleCheck.acyclic).toBe(false);
            expect(cycleCheck.cycle).toContain('TEST:AS001');
            expect(cycleCheck.cycle).toContain('TEST:AS002');
        });
    });
});

describe('MasteryState', () => {
    let masteryState;

    beforeEach(() => {
        masteryState = new MasteryState();
    });

    test('creates and retrieves skill states', () => {
        const state = masteryState.getSkillState('TEST:AS001');
        expect(state).toBeDefined();
        expect(state.id).toBe('TEST:AS001');
        expect(state.status).toBe('unseen');
    });

    test('updates skill state', () => {
        masteryState.updateSkillState('TEST:AS001', {
            status: 'in_progress',
            s: 0.5,
            next_due: '2025-01-01T00:00:00Z'
        });

        const state = masteryState.getSkillState('TEST:AS001');
        expect(state.status).toBe('in_progress');
        expect(state.s).toBe(0.5);
        expect(state.next_due).toBe('2025-01-01T00:00:00Z');
    });

    test('identifies overdue skills', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        masteryState.updateSkillState('TEST:AS001', {
            status: 'in_progress',
            next_due: pastDate
        });

        masteryState.updateSkillState('TEST:AS002', {
            status: 'in_progress',
            next_due: futureDate
        });

        const overdue = masteryState.getOverdueSkills();
        expect(overdue).toContain('TEST:AS001');
        expect(overdue).not.toContain('TEST:AS002');
    });

    test('exports to JSON correctly', () => {
        masteryState.updateSkillState('TEST:AS001', {
            status: 'mastered',
            s: 1.5
        });

        const json = masteryState.toJSON();
        expect(json.format).toBe('Mastery-v2');
        expect(json.ass['TEST:AS001']).toBeDefined();
        expect(json.ass['TEST:AS001'].status).toBe('mastered');
    });
});

describe('AttemptWindow', () => {
    let attemptWindow;

    beforeEach(() => {
        attemptWindow = new AttemptWindow();
    });

    test('tracks skill attempts', () => {
        attemptWindow.addSkillAttempt('TEST:AS001', 3);
        attemptWindow.addSkillAttempt('TEST:AS001', 4);
        attemptWindow.addSkillAttempt('TEST:AS001', 5);

        const attempts = attemptWindow.getSkillAttempts('TEST:AS001');
        expect(attempts).toEqual([3, 4, 5]);
    });

    test('limits attempt history to 10', () => {
        for (let i = 1; i <= 15; i++) {
            attemptWindow.addSkillAttempt('TEST:AS001', i);
        }

        const attempts = attemptWindow.getSkillAttempts('TEST:AS001');
        expect(attempts).toHaveLength(10);
        expect(attempts[0]).toBe(6); // First 5 should be dropped
        expect(attempts[9]).toBe(15);
    });

    test('checks mastery criteria correctly', () => {
        // Not enough attempts
        attemptWindow.addSkillAttempt('TEST:AS001', 5);
        attemptWindow.addSkillAttempt('TEST:AS001', 5);
        expect(attemptWindow.checkMasteryCriteria('TEST:AS001')).toBe(false);

        // Enough attempts, all grade 5
        attemptWindow.addSkillAttempt('TEST:AS001', 5);
        expect(attemptWindow.checkMasteryCriteria('TEST:AS001')).toBe(true);

        // Add a non-5 grade
        attemptWindow.addSkillAttempt('TEST:AS001', 4);
        expect(attemptWindow.checkMasteryCriteria('TEST:AS001')).toBe(false);
    });
});