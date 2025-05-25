import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LearningView } from '../js/views/LearningView.js';
import { MixedQuizView } from '../js/views/MixedQuizView.js';
import { LibraryView } from '../js/views/LibraryView.js';
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

    test('LibraryView renderTopicDetails includes skill codes and prereqs', async () => {
        await courseManager.initialize();
        const libraryView = new LibraryView(courseManager);

        const course = courseManager.getCourse('EA');
        const topic = course.getAllTopics()[0];

        const state = courseManager.masteryState.getSkillState('EA:AS004');
        state.status = 'in_progress';
        state.next_due = new Date(Date.now() + 86400000).toISOString();

        const html = libraryView.renderTopicDetails(course, topic);

        expect(typeof html).toBe('string');
        expect(html).toContain('EA:AS004 -');
        expect(html).toContain('Prereqs');
        expect(html).toContain('Next review in');
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

describe('Markdown Rendering', () => {
    test('LearningView.renderMarkdown parses lists, headings and math', () => {
        const view = new LearningView();
        const md = '# Title\n- item1\n- item2\n\nInline $x$';
        const html = view.renderMarkdown(md);
        expect(html).toContain('<h1>Title</h1>');
        expect(html).toContain('<ul>');
        expect(html).toContain('<li>item1</li>');
        expect(html).toContain('<li>item2</li>');
        expect(html).toContain('$x$');
    });

    test('MixedQuizView.renderMarkdown parses lists, headings and math', () => {
        const view = new MixedQuizView();
        const md = '## Heading\n1. one\n2. two\n\nEquation $y$';
        const html = view.renderMarkdown(md);
        expect(html).toContain('<h2>Heading</h2>');
        expect(html).toContain('<ol>');
        expect(html).toContain('<li>one</li>');
        expect(html).toContain('<li>two</li>');
        expect(html).toContain('$y$');
    });

    test('showExposition triggers MathJax typesetting', async () => {
        const courseManager = { getSkillExplanation: vi.fn(async () => '# H\n') };
        const view = new LearningView(courseManager);
        view.currentSkill = { id: 'EA:AS001', title: 'Test' };

        global.document = { getElementById: vi.fn(() => ({ innerHTML: '' })) };
        global.window.MathJax = { typesetPromise: vi.fn() };

        await view.showExposition();
        expect(window.MathJax.typesetPromise).toHaveBeenCalled();
    });
});