import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningView } from '../js/views/LearningView.js';
import { CourseManager } from '../js/services/CourseManager.js';
import { MasteryState } from '../js/models/MasteryState.js';

// Mock DOM
Object.defineProperty(window, 'MathJax', {
    value: {
        typesetPromise: vi.fn()
    },
    writable: true
});

// Mock document methods
global.document = {
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => ({
        classList: { add: vi.fn(), remove: vi.fn() },
        addEventListener: vi.fn()
    }))
};

describe('LearningView Rating Flow', () => {
    let learningView;
    let mockCourseManager;
    let mockMasteryState;
    let mockSkillState;

    beforeEach(() => {
        // Mock skill state
        mockSkillState = {
            status: 'in_progress',
            next_q_index: 0,
            s: 1.0,
            d: 5.0,
            r: 0,
            l: 0,
            next_due: new Date().toISOString()
        };

        // Mock mastery state
        mockMasteryState = {
            getSkillState: vi.fn(() => mockSkillState),
            setSkillState: vi.fn(),
            isSkillMastered: vi.fn(() => false)
        };

        // Mock course manager
        mockCourseManager = {
            recordSkillAttempt: vi.fn(),
            addXP: vi.fn(),
            saveState: vi.fn(),
            masteryState: mockMasteryState
        };

        // Create learning view instance
        learningView = new LearningView();
        learningView.courseManager = mockCourseManager;
        
        // Mock current skill and questions
        learningView.currentSkill = {
            id: 'EA:AS001',
            title: 'Test Skill'
        };
        
        learningView.questions = [
            {
                id: 'q1',
                stem: 'What is 1+1?',
                choices: ['1', '2', '3', '4'],
                correct: 1,
                solution: 'The answer is 2'
            },
            {
                id: 'q2',
                stem: 'What is 2+2?',
                choices: ['3', '4', '5', '6'],
                correct: 1,
                solution: 'The answer is 4'
            },
            {
                id: 'q3',
                stem: 'What is 3+3?',
                choices: ['5', '6', '7', '8'],
                correct: 1,
                solution: 'The answer is 6'
            },
            {
                id: 'q4',
                stem: 'What is 4+4?',
                choices: ['6', '8', '9', '10'],
                correct: 1,
                solution: 'The answer is 8'
            },
            {
                id: 'q5',
                stem: 'What is 5+5?',
                choices: ['9', '10', '11', '12'],
                correct: 1,
                solution: 'The answer is 10'
            },
            {
                id: 'q6',
                stem: 'What is 6+6?',
                choices: ['11', '12', '13', '14'],
                correct: 1,
                solution: 'The answer is 12'
            },
            {
                id: 'q7',
                stem: 'What is 7+7?',
                choices: ['13', '14', '15', '16'],
                correct: 1,
                solution: 'The answer is 14'
            },
            {
                id: 'q8',
                stem: 'What is 8+8?',
                choices: ['15', '16', '17', '18'],
                correct: 1,
                solution: 'The answer is 16'
            },
            {
                id: 'q9',
                stem: 'What is 9+9?',
                choices: ['17', '18', '19', '20'],
                correct: 1,
                solution: 'The answer is 18'
            },
            {
                id: 'q10',
                stem: 'What is 10+10?',
                choices: ['19', '20', '21', '22'],
                correct: 1,
                solution: 'The answer is 20'
            }
        ];
        
        learningView.currentQuestionIndex = 0;
        learningView.grades = [];
        learningView.consecutiveEasy = 0;
        learningView.selectedAnswer = null;
        learningView.isAnswered = false;

        // Mock DOM manipulation methods
        learningView.showQuestion = vi.fn();
        learningView.endSession = vi.fn();
        learningView.showToast = vi.fn();
    });

    describe('rateAndContinue', () => {
        it('should record grade and move to next question on successful attempt', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            
            await learningView.rateAndContinue(4);
            
            expect(learningView.grades).toEqual([4]);
            expect(learningView.currentQuestionIndex).toBe(1);
            expect(mockCourseManager.recordSkillAttempt).toHaveBeenCalledWith('EA:AS001', 4);
            expect(mockCourseManager.addXP).toHaveBeenCalledWith(10, 'EA:AS001_q0');
            expect(mockSkillState.next_q_index).toBe(1);
            expect(mockCourseManager.saveState).toHaveBeenCalled();
            expect(learningView.showQuestion).toHaveBeenCalled();
        });

        it('should handle FSRS failure gracefully and still advance', async () => {
            mockCourseManager.recordSkillAttempt.mockRejectedValue(new Error('FSRS failed'));
            
            await learningView.rateAndContinue(5);
            
            expect(learningView.grades).toEqual([5]);
            expect(learningView.currentQuestionIndex).toBe(1);
            expect(mockSkillState.next_q_index).toBe(1);
            expect(mockCourseManager.saveState).toHaveBeenCalled();
            expect(learningView.showQuestion).toHaveBeenCalled();
            expect(learningView.showToast).toHaveBeenCalledWith(
                'Failed to record skill attempt, but continuing session',
                'error'
            );
        });

        it('should track consecutive easy ratings correctly', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            
            // First easy rating
            await learningView.rateAndContinue(5);
            expect(learningView.consecutiveEasy).toBe(1);
            
            // Second easy rating
            await learningView.rateAndContinue(5);
            expect(learningView.consecutiveEasy).toBe(2);
            
            // Non-easy rating should reset
            await learningView.rateAndContinue(3);
            expect(learningView.consecutiveEasy).toBe(0);
        });

        it('should reset consecutive easy count on non-easy grades', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            learningView.consecutiveEasy = 1;
            
            await learningView.rateAndContinue(3);
            
            expect(learningView.consecutiveEasy).toBe(0);
        });

        it('should wrap question index correctly', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            learningView.currentQuestionIndex = 9; // Last question (10 questions total, 0-indexed)
            
            await learningView.rateAndContinue(4);
            
            expect(learningView.currentQuestionIndex).toBe(10);
            expect(mockSkillState.next_q_index).toBe(0); // Should wrap to 0
        });

        it('should end session when shouldEndSession returns true', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            learningView.shouldEndSession = vi.fn(() => true);
            
            await learningView.rateAndContinue(5);
            
            expect(learningView.endSession).toHaveBeenCalled();
            expect(learningView.showQuestion).not.toHaveBeenCalled();
        });

        it('should reset answer state for next question', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            learningView.selectedAnswer = 1;
            learningView.isAnswered = true;
            
            await learningView.rateAndContinue(4);
            
            expect(learningView.selectedAnswer).toBe(null);
            expect(learningView.isAnswered).toBe(false);
        });
    });

    describe('shouldEndSession', () => {
        it('should return true after two consecutive easy ratings', () => {
            learningView.consecutiveEasy = 2;
            expect(learningView.shouldEndSession()).toBe(true);
        });

        it('should return false with less than two consecutive easy ratings', () => {
            learningView.consecutiveEasy = 1;
            expect(learningView.shouldEndSession()).toBe(false);
            
            learningView.consecutiveEasy = 0;
            expect(learningView.shouldEndSession()).toBe(false);
        });

        it('should return true when question pool is exhausted', () => {
            learningView.consecutiveEasy = 0;
            learningView.currentQuestionIndex = 25; // Assuming pool is exhausted at some point
            learningView.grades = new Array(25).fill(3); // 25 questions attempted
            expect(learningView.shouldEndSession()).toBe(true);
        });
    });

    describe('error handling edge cases', () => {
        it('should handle multiple consecutive failures gracefully', async () => {
            mockCourseManager.recordSkillAttempt.mockRejectedValue(new Error('Persistent FSRS failure'));
            
            // Try multiple ratings
            await learningView.rateAndContinue(4);
            await learningView.rateAndContinue(5);
            await learningView.rateAndContinue(3);
            
            expect(learningView.grades).toEqual([4, 5, 3]);
            expect(learningView.currentQuestionIndex).toBe(3);
            expect(learningView.showToast).toHaveBeenCalledTimes(3);
        });

        it('should handle missing skill state gracefully', async () => {
            mockMasteryState.getSkillState.mockReturnValue(null);
            mockCourseManager.recordSkillAttempt.mockRejectedValue(new Error('No skill state'));
            
            try {
                await learningView.rateAndContinue(4);
            } catch (error) {
                // Expected to fail due to null skill state
                expect(error.message).toContain('Cannot set properties of null');
            }
            
            expect(learningView.grades).toEqual([4]);
        });

        it('should handle saveState failure', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            mockCourseManager.saveState.mockImplementation(() => {
                throw new Error('Save failed');
            });
            
            await learningView.rateAndContinue(4);
            
            // Should still advance despite save failure
            expect(learningView.grades).toEqual([4]);
            expect(learningView.currentQuestionIndex).toBe(1);
        });
    });

    describe('integration scenarios', () => {
        it('should complete a full session with two consecutive easy ratings', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            learningView.shouldEndSession = vi.fn()
                .mockReturnValueOnce(false)  // After first easy
                .mockReturnValueOnce(true);  // After second easy
            
            // First easy rating
            await learningView.rateAndContinue(5);
            expect(learningView.consecutiveEasy).toBe(1);
            expect(learningView.endSession).not.toHaveBeenCalled();
            
            // Second easy rating
            await learningView.rateAndContinue(5);
            expect(learningView.consecutiveEasy).toBe(2);
            expect(learningView.endSession).toHaveBeenCalled();
        });

        it('should handle mixed grades and continue session', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            
            // Series of mixed grades
            const grades = [3, 4, 2, 5, 3, 4, 5, 5];
            
            for (let i = 0; i < grades.length - 1; i++) {
                await learningView.rateAndContinue(grades[i]);
                expect(learningView.endSession).not.toHaveBeenCalled();
            }
            
            // Last grade should trigger end (two consecutive 5s)
            learningView.shouldEndSession = vi.fn(() => true);
            await learningView.rateAndContinue(grades[grades.length - 1]);
            expect(learningView.endSession).toHaveBeenCalled();
        });

        it('should preserve state across rating attempts', async () => {
            mockCourseManager.recordSkillAttempt.mockResolvedValue();
            
            // Verify initial state
            expect(learningView.currentQuestionIndex).toBe(0);
            expect(learningView.grades).toEqual([]);
            
            // After first rating
            await learningView.rateAndContinue(4);
            expect(learningView.currentQuestionIndex).toBe(1);
            expect(learningView.grades).toEqual([4]);
            
            // After second rating
            await learningView.rateAndContinue(5);
            expect(learningView.currentQuestionIndex).toBe(2);
            expect(learningView.grades).toEqual([4, 5]);
        });
    });
});