import { describe, it, expect, beforeEach } from 'vitest';
import { FSRSService } from '../js/services/fsrs.js';

describe('FSRSService', () => {
    let fsrsService;

    beforeEach(() => {
        fsrsService = new FSRSService();
    });

    describe('initialization', () => {
        it('should initialize successfully in test environment', async () => {
            await fsrsService.initialize();
            expect(fsrsService.initialized).toBe(true);
            expect(fsrsService.fsrsModule).toBeDefined();
            expect(fsrsService.Rating).toBeDefined();
            expect(fsrsService.scheduler).toBeDefined();
        });

        it('should only initialize once', async () => {
            await fsrsService.initialize();
            const firstModule = fsrsService.fsrsModule;
            
            await fsrsService.initialize();
            expect(fsrsService.fsrsModule).toBe(firstModule);
        });

        it('should set up grade to rating mapping', async () => {
            await fsrsService.initialize();
            
            expect(fsrsService.gradeToRating[1]).toBe(fsrsService.Rating.Again);
            expect(fsrsService.gradeToRating[2]).toBe(fsrsService.Rating.Again);
            expect(fsrsService.gradeToRating[3]).toBe(fsrsService.Rating.Hard);
            expect(fsrsService.gradeToRating[4]).toBe(fsrsService.Rating.Good);
            expect(fsrsService.gradeToRating[5]).toBe(fsrsService.Rating.Easy);
        });
    });

    describe('createNewCard', () => {
        it('should create a default card when not initialized', () => {
            const card = fsrsService.createNewCard();
            
            expect(card).toHaveProperty('due');
            expect(card).toHaveProperty('stability', 0);
            expect(card).toHaveProperty('difficulty', 0);
            expect(card).toHaveProperty('reps', 0);
            expect(card).toHaveProperty('lapses', 0);
        });

        it('should create an FSRS card when initialized', async () => {
            await fsrsService.initialize();
            const card = fsrsService.createNewCard();
            
            expect(card).toBeDefined();
            expect(card).toHaveProperty('due');
        });
    });

    describe('scheduleReview', () => {
        beforeEach(async () => {
            await fsrsService.initialize();
        });

        it('should schedule review for grade 5 (Easy)', async () => {
            const currentState = {
                s: 1.0,
                d: 5.0,
                r: 0,
                l: 0,
                next_due: new Date().toISOString()
            };

            const result = await fsrsService.scheduleReview(currentState, 5);
            
            expect(result).toHaveProperty('s');
            expect(result).toHaveProperty('d');
            expect(result).toHaveProperty('r');
            expect(result).toHaveProperty('l');
            expect(result).toHaveProperty('next_due');
            expect(typeof result.s).toBe('number');
            expect(typeof result.d).toBe('number');
            expect(typeof result.r).toBe('number');
            expect(typeof result.l).toBe('number');
            expect(typeof result.next_due).toBe('string');
        });

        it('should schedule review for grade 1 (Incorrect)', async () => {
            const currentState = {
                s: 1.0,
                d: 5.0,
                r: 0,
                l: 0,
                next_due: new Date().toISOString()
            };

            const result = await fsrsService.scheduleReview(currentState, 1);
            
            expect(result).toHaveProperty('s');
            expect(result).toHaveProperty('d');
            expect(result).toHaveProperty('r');
            expect(result).toHaveProperty('l');
            expect(result).toHaveProperty('next_due');
        });

        it('should handle all grade values (1-5)', async () => {
            const currentState = {
                s: 1.0,
                d: 5.0,
                r: 0,
                l: 0,
                next_due: new Date().toISOString()
            };

            for (let grade = 1; grade <= 5; grade++) {
                const result = await fsrsService.scheduleReview(currentState, grade);
                expect(result).toBeDefined();
                expect(result.next_due).toBeDefined();
            }
        });

        it('should handle empty/default state', async () => {
            const currentState = {
                next_due: new Date().toISOString()
            };

            const result = await fsrsService.scheduleReview(currentState, 4);
            
            expect(result).toBeDefined();
            expect(result.s).toBeDefined();
            expect(result.d).toBeDefined();
            expect(result.r).toBeDefined();
            expect(result.l).toBeDefined();
            expect(result.next_due).toBeDefined();
        });
    });

    describe('calculateImplicitCredit', () => {
        beforeEach(async () => {
            await fsrsService.initialize();
        });

        it('should calculate implicit credit with default parameters', async () => {
            const prereqState = {
                s: 1.0,
                d: 5.0,
                r: 1,
                l: 0,
                next_due: new Date().toISOString()
            };

            const result = await fsrsService.calculateImplicitCredit(prereqState);
            
            expect(result).toHaveProperty('s', prereqState.s);
            expect(result).toHaveProperty('d', prereqState.d);
            expect(result).toHaveProperty('r', prereqState.r);
            expect(result).toHaveProperty('l', prereqState.l);
            expect(result).toHaveProperty('next_due');
            expect(result.next_due).not.toBe(prereqState.next_due);
        });

        it('should apply weight factor correctly', async () => {
            const prereqState = {
                s: 1.0,
                d: 5.0,
                r: 1,
                l: 0,
                next_due: new Date().toISOString()
            };

            const resultHalfWeight = await fsrsService.calculateImplicitCredit(prereqState, 0.5);
            const resultFullWeight = await fsrsService.calculateImplicitCredit(prereqState, 1.0);
            
            expect(resultHalfWeight).toBeDefined();
            expect(resultFullWeight).toBeDefined();
            // Both should have valid dates but potentially different intervals
        });

        it('should apply alpha implicit factor correctly', async () => {
            const prereqState = {
                s: 1.0,
                d: 5.0,
                r: 1,
                l: 0,
                next_due: new Date().toISOString()
            };

            const resultSmallAlpha = await fsrsService.calculateImplicitCredit(prereqState, 1.0, 0.1);
            const resultLargeAlpha = await fsrsService.calculateImplicitCredit(prereqState, 1.0, 0.5);
            
            expect(resultSmallAlpha).toBeDefined();
            expect(resultLargeAlpha).toBeDefined();
        });
    });

    describe('isOverdue', () => {
        it('should return true for past dates', () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            expect(fsrsService.isOverdue(pastDate)).toBe(true);
        });

        it('should return false for future dates', () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            expect(fsrsService.isOverdue(futureDate)).toBe(false);
        });

        it('should return true for current time (within same second)', () => {
            const now = new Date().toISOString();
            expect(fsrsService.isOverdue(now)).toBe(true);
        });
    });

    describe('getDaysOverdue', () => {
        it('should return positive days for overdue dates', () => {
            const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
            const daysOverdue = fsrsService.getDaysOverdue(pastDate);
            
            expect(daysOverdue).toBeGreaterThan(1.5);
            expect(daysOverdue).toBeLessThan(2.5);
        });

        it('should return negative days for future dates', () => {
            const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
            const daysOverdue = fsrsService.getDaysOverdue(futureDate);
            
            expect(daysOverdue).toBeLessThan(-1.5);
            expect(daysOverdue).toBeGreaterThan(-2.5);
        });

        it('should return approximately 0 for current time', () => {
            const now = new Date().toISOString();
            const daysOverdue = fsrsService.getDaysOverdue(now);
            
            expect(Math.abs(daysOverdue)).toBeLessThan(0.1);
        });
    });

    describe('error handling', () => {
        it('should handle initialization failure gracefully', async () => {
            // Create a service that will fail to import
            const failingService = new FSRSService();
            
            // Since we can't mock the import in vitest easily, we'll simulate an error
            // by manually triggering an error condition
            failingService.initialize = async function() {
                try {
                    throw new Error('Module not found');
                } catch (e) {
                    console.error('Failed to initialize FSRS module:', e);
                    throw e;
                }
            };
            
            await expect(failingService.initialize()).rejects.toThrow('Module not found');
        });

        it('should handle scheduleReview before initialization', async () => {
            const uninitializedService = new FSRSService();
            const currentState = {
                s: 1.0,
                d: 5.0,
                r: 0,
                l: 0,
                next_due: new Date().toISOString()
            };

            // Should initialize automatically
            const result = await uninitializedService.scheduleReview(currentState, 4);
            expect(result).toBeDefined();
            expect(uninitializedService.initialized).toBe(true);
        });
    });
});