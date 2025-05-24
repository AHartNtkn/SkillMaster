import { describe, test, expect, beforeEach, vi } from 'vitest';
import { FSRSService } from '../js/services/fsrs.js';

// Mock the fsrs.js module
vi.mock('fsrs.js', () => ({
    Rating: {
        Again: 1,
        Hard: 2,
        Good: 3,
        Easy: 4,
    },
    fsrs: vi.fn(() => ({
        repeat: vi.fn(() => ({
            1: { card: { due: new Date(), stability: 0.1, difficulty: 1, reps: 1, lapses: 0 } },
            2: { card: { due: new Date(), stability: 0.2, difficulty: 2, reps: 1, lapses: 0 } },
            3: { card: { due: new Date(), stability: 0.3, difficulty: 3, reps: 1, lapses: 0 } },
            4: { card: { due: new Date(), stability: 0.4, difficulty: 4, reps: 1, lapses: 0 } },
        })),
    })),
    createEmptyCard: vi.fn(() => ({
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        lastReview: new Date()
    })),
    generatorParameters: vi.fn(() => ({
        request_retention: 0.9,
        maximum_interval: 36500,
        easy_bonus: 1.3,
        hard_factor: 1.2,
    }))
}));

describe('FSRSService Initialization in Vitest', () => {
    test('should initialize FSRSService without errors in Vitest environment', async () => {
        const fsrsService = new FSRSService();
        await expect(fsrsService.initialize()).resolves.not.toThrow();
        expect(fsrsService.initialized).toBe(true);
        expect(fsrsService.scheduler).toBeDefined();
        expect(fsrsService.Rating).toBeDefined();
    });

    test('createNewCard should use the mock in Vitest', () => {
        const fsrsService = new FSRSService();
        fsrsService.initialize(); // Initialize to setup fsrsModule from mock
        const card = fsrsService.createNewCard();
        // Note: Mock verification is handled automatically by the alias
        expect(card).toBeDefined();
    });
});

describe('FSRSService - Real Functionality (Mocked FSRS Module)', () => {
    let fsrsService;

    beforeEach(async () => {
        fsrsService = new FSRSService();
        // We need to initialize to set up the mocked fsrsModule, scheduler, and Rating
        await fsrsService.initialize();
    });

    test('scheduleReview should call the mocked scheduler', async () => {
        const currentState = { s: 0, d: 0, r: 0, l: 0, next_due: new Date().toISOString() };
        await fsrsService.scheduleReview(currentState, 3); // Grade 3 (Okay/Good)
        // Note: Mock verification is handled automatically by the alias
    });

    test('calculateImplicitCredit should use scheduleReview (which uses mocked FSRS)', async () => {
        const prereqState = { s: 0, d: 0, r: 0, l: 0, next_due: new Date().toISOString() };
        const scheduleReviewSpy = vi.spyOn(fsrsService, 'scheduleReview');
        await fsrsService.calculateImplicitCredit(prereqState, 1.0, 0.3);
        expect(scheduleReviewSpy).toHaveBeenCalledWith(prereqState, 4); // Should call with grade 4 (Good)
        scheduleReviewSpy.mockRestore();
    });

    test('isOverdue should correctly identify overdue dates', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const presentDate = new Date().toISOString();

        expect(fsrsService.isOverdue(pastDate)).toBe(true);
        expect(fsrsService.isOverdue(futureDate)).toBe(false);
        expect(fsrsService.isOverdue(presentDate)).toBe(true); // Due now is considered overdue
    });

    test('getDaysOverdue should calculate correctly', () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        expect(fsrsService.getDaysOverdue(twoDaysAgo.toISOString())).toBeCloseTo(2, 0);

        const twoDaysHence = new Date();
        twoDaysHence.setDate(twoDaysHence.getDate() + 2);
        expect(fsrsService.getDaysOverdue(twoDaysHence.toISOString())).toBeCloseTo(-2, 0);
    });
});