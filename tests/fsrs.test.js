import { describe, test, expect, beforeEach } from '@jest/globals';
import { FSRSService } from '../js/services/fsrs.js';

describe('FSRSService', () => {
    let fsrsService;

    beforeEach(async () => {
        fsrsService = new FSRSService();
        await fsrsService.initialize();
    });

    test('creates new card correctly', () => {
        const card = fsrsService.createNewCard();
        expect(card).toBeDefined();
        expect(card.due).toBeInstanceOf(Date);
        expect(card.stability).toBe(0);
        expect(card.difficulty).toBe(0);
    });

    test('schedules review for grade 1 (incorrect)', async () => {
        const initialState = {
            s: 0.12,
            d: 0.36,
            r: 1,
            l: 0,
            next_due: new Date().toISOString()
        };

        const updatedState = await fsrsService.scheduleReview(initialState, 1);
        expect(updatedState.l).toBeGreaterThan(initialState.l); // Lapses should increase
        expect(updatedState.next_due).toBeDefined();
    });

    test('schedules review for grade 5 (easy)', async () => {
        const initialState = {
            s: 0.12,
            d: 0.36,
            r: 1,
            l: 0,
            next_due: new Date().toISOString()
        };

        const updatedState = await fsrsService.scheduleReview(initialState, 5);
        expect(updatedState.r).toBeGreaterThan(initialState.r); // Reps should increase
        expect(new Date(updatedState.next_due)).toBeInstanceOf(Date);
    });

    test('calculates implicit credit correctly', async () => {
        const prereqState = {
            s: 0.5,
            d: 0.3,
            r: 2,
            l: 0,
            next_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        };

        const updatedState = await fsrsService.calculateImplicitCredit(prereqState, 0.8, 0.3);
        expect(updatedState.next_due).toBeDefined();
        
        // The new due date should be sooner than the virtual "Good" rating would give
        const newDue = new Date(updatedState.next_due);
        const now = new Date();
        const daysDiff = (newDue - now) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeGreaterThan(0);
        expect(daysDiff).toBeLessThan(10); // Should be dampened
    });

    test('correctly identifies overdue skills', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow

        expect(fsrsService.isOverdue(pastDate)).toBe(true);
        expect(fsrsService.isOverdue(futureDate)).toBe(false);
    });

    test('calculates days overdue correctly', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        expect(fsrsService.getDaysOverdue(threeDaysAgo)).toBe(3);
        expect(fsrsService.getDaysOverdue(tomorrow)).toBe(0);
    });
});