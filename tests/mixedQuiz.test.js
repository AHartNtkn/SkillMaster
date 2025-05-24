import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { MixedQuizView } from '../js/views/MixedQuizView.js';
import { CourseManager } from '../js/services/CourseManager.js';
import { TaskSelector } from '../js/services/TaskSelector.js';

describe('MixedQuizView FSRS Update', () => {
    let courseManager;
    let taskSelector;
    let mixedQuizView;
    let mockRecordSkillAttempt;
    
    beforeEach(async () => {
        // Clear localStorage
        localStorage.clear();
        
        // Initialize services
        courseManager = new CourseManager();
        await courseManager.initialize();
        taskSelector = new TaskSelector(courseManager);
        
        // Mock the recordSkillAttempt method to track calls
        mockRecordSkillAttempt = vi.spyOn(courseManager, 'recordSkillAttempt');
        
        // Create the view
        mixedQuizView = new MixedQuizView(courseManager, taskSelector);
        
        // Mock DOM elements
        document.body.innerHTML = '<div id="main-content"></div>';
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });
    
    test('should update FSRS after each question, not average at the end', async () => {
        // Set up test quiz with multiple questions from the same skill
        const testSkillId = 'EA:AS001';
        mixedQuizView.quizQuestions = [
            {
                skillId: testSkillId,
                question: {
                    stem: 'Question 1',
                    choices: ['A', 'B', 'C', 'D'],
                    correct: 0,
                    solution: 'Solution 1'
                },
                questionIndex: 0
            },
            {
                skillId: testSkillId,
                question: {
                    stem: 'Question 2',
                    choices: ['A', 'B', 'C', 'D'],
                    correct: 1,
                    solution: 'Solution 2'
                },
                questionIndex: 1
            },
            {
                skillId: testSkillId,
                question: {
                    stem: 'Question 3',
                    choices: ['A', 'B', 'C', 'D'],
                    correct: 2,
                    solution: 'Solution 3'
                },
                questionIndex: 2
            }
        ];
        
        // Simulate answering first question correctly with grade 5 (Easy)
        mixedQuizView.currentQuestionIndex = 0;
        await mixedQuizView.rateAndContinue(5);
        
        // Verify FSRS was updated immediately with grade 5
        expect(mockRecordSkillAttempt).toHaveBeenCalledWith(testSkillId, 5, true);
        expect(mockRecordSkillAttempt).toHaveBeenCalledTimes(1);
        
        // Simulate answering second question correctly with grade 3 (Hard)
        mixedQuizView.currentQuestionIndex = 1;
        await mixedQuizView.rateAndContinue(3);
        
        // Verify FSRS was updated again with grade 3
        expect(mockRecordSkillAttempt).toHaveBeenCalledWith(testSkillId, 3, true);
        expect(mockRecordSkillAttempt).toHaveBeenCalledTimes(2);
        
        // Simulate answering third question incorrectly (grade 1)
        mixedQuizView.currentQuestionIndex = 2;
        await mixedQuizView.rateAndContinue(1);
        
        // Verify FSRS was updated with grade 1
        expect(mockRecordSkillAttempt).toHaveBeenCalledWith(testSkillId, 1, true);
        expect(mockRecordSkillAttempt).toHaveBeenCalledTimes(3);
        
        // Verify each grade was recorded separately
        const allCalls = mockRecordSkillAttempt.mock.calls;
        expect(allCalls[0][1]).toBe(5); // First call: grade 5
        expect(allCalls[1][1]).toBe(3); // Second call: grade 3  
        expect(allCalls[2][1]).toBe(1); // Third call: grade 1
    });
    
    test('should handle mixed quiz with questions from different skills', async () => {
        // Set up test quiz with questions from different skills
        mixedQuizView.quizQuestions = [
            {
                skillId: 'EA:AS001',
                question: {
                    stem: 'AS001 Question',
                    choices: ['A', 'B', 'C', 'D'],
                    correct: 0,
                    solution: 'Solution'
                },
                questionIndex: 0
            },
            {
                skillId: 'EA:AS003',
                question: {
                    stem: 'AS003 Question',
                    choices: ['A', 'B', 'C', 'D'],
                    correct: 1,
                    solution: 'Solution'
                },
                questionIndex: 0
            }
        ];
        
        // Answer first question with grade 4
        mixedQuizView.currentQuestionIndex = 0;
        await mixedQuizView.rateAndContinue(4);
        
        expect(mockRecordSkillAttempt).toHaveBeenCalledWith('EA:AS001', 4, true);
        
        // Answer second question with grade 5
        mixedQuizView.currentQuestionIndex = 1;
        await mixedQuizView.rateAndContinue(5);
        
        expect(mockRecordSkillAttempt).toHaveBeenCalledWith('EA:AS003', 5, true);
        
        // Verify each skill was updated exactly once with its specific grade
        expect(mockRecordSkillAttempt).toHaveBeenCalledTimes(2);
    });
});