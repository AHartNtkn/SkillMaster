import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LearningView } from '../js/views/LearningView.js';
import { MixedQuizView } from '../js/views/MixedQuizView.js';
import { CourseManager } from '../js/services/CourseManager.js';
import { TaskSelector } from '../js/services/TaskSelector.js';

describe('View Render Methods', () => {
    let courseManager;
    let taskSelector;
    
    beforeEach(() => {
        courseManager = new CourseManager();
        taskSelector = new TaskSelector(courseManager);
    });
    
    test('LearningView should have a render method', () => {
        const learningView = new LearningView(courseManager);
        expect(typeof learningView.render).toBe('function');
    });
    
    test('LearningView render should return HTML string', () => {
        const learningView = new LearningView(courseManager);
        const html = learningView.render();
        
        expect(typeof html).toBe('string');
        expect(html).toContain('Loading...');
        expect(html).toContain('Preparing skill content...');
    });
    
    test('MixedQuizView should have a render method', () => {
        const mixedQuizView = new MixedQuizView(courseManager, taskSelector);
        expect(typeof mixedQuizView.render).toBe('function');
    });
    
    test('MixedQuizView render should return HTML string', () => {
        const mixedQuizView = new MixedQuizView(courseManager, taskSelector);
        const html = mixedQuizView.render();
        
        expect(typeof html).toBe('string');
        expect(html).toContain('Loading Mixed Quiz...');
        expect(html).toContain('Preparing questions from multiple skills...');
    });
});

describe('View Start Methods', () => {
    let courseManager;
    let taskSelector;
    
    beforeEach(() => {
        courseManager = new CourseManager();
        taskSelector = new TaskSelector(courseManager);
        
        // Mock DOM manipulation
        global.document = {
            getElementById: vi.fn(() => ({
                innerHTML: ''
            }))
        };
    });
    
    test('LearningView startSkill should handle missing skill gracefully', async () => {
        const learningView = new LearningView(courseManager);
        
        // Mock getSkill to return null
        vi.spyOn(courseManager, 'getSkill').mockReturnValue(null);
        
        // Mock console.error to verify it's called
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        await learningView.startSkill('NONEXISTENT');
        
        expect(consoleError).toHaveBeenCalledWith('Skill NONEXISTENT not found');
        
        consoleError.mockRestore();
    });
    
    test('MixedQuizView startMixedQuiz should handle no questions gracefully', async () => {
        const mixedQuizView = new MixedQuizView(courseManager, taskSelector);
        
        // Mock assembleMixedQuiz to return empty array
        vi.spyOn(courseManager, 'assembleMixedQuiz').mockReturnValue([]);
        
        // Mock showNoQuestionsAvailable
        vi.spyOn(mixedQuizView, 'showNoQuestionsAvailable').mockImplementation(() => {});
        
        await mixedQuizView.startMixedQuiz();
        
        expect(mixedQuizView.showNoQuestionsAvailable).toHaveBeenCalled();
    });
});