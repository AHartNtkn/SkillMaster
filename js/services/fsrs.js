/**
 * FSRS-5 Spaced Repetition Service
 * Manages the scheduling and review intervals for atomic skills
 */
export class FSRSService {
    constructor() {
        this.fsrsModule = null;
        this.scheduler = null;
        this.Rating = null;
        this.initialized = false;
        
        // Map our grade system to FSRS ratings (will be set after module loads)
        this.gradeToRating = {};
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Check if running in Jest or Vitest test environment
            if (typeof process !== 'undefined' && (process.env.JEST_WORKER_ID !== undefined || process.env.VITEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test')) {
                // In Jest/Vitest, dynamically import 'fsrs.js'. 
                // The mock should intercept this.
                const module = await import('fsrs.js');
                this.fsrsModule = module;
                this.Rating = module.Rating;
                
                // Check if we have the old mock API or new API
                if (module.fsrs && module.generatorParameters) {
                    // Old mock API
                    const fsrs = module.fsrs;
                    const generatorParameters = module.generatorParameters;
                    this.scheduler = fsrs(generatorParameters());
                } else if (module.FSRS) {
                    // New API (both real and updated mock)
                    const FSRS = module.FSRS;
                    this.scheduler = new FSRS();
                } else {
                    throw new Error('FSRS module (mocked via fsrs.js) missing required exports in test environment');
                }
            } else {
                // In browser environment, import fsrs.js normally
                const module = await import('fsrs.js');
                this.fsrsModule = module;
                this.Rating = module.Rating;
                const FSRS = module.FSRS;
                if (!this.Rating || !FSRS) {
                    throw new Error('FSRS module missing required exports');
                }
                this.scheduler = new FSRS();
            }
        } catch (e) {
            console.error('Failed to initialize FSRS module:', e);
            if (typeof process !== 'undefined' && (process.env.JEST_WORKER_ID !== undefined || process.env.VITEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test')) {
                console.error('FSRS import error in test environment. Ensure \'fsrs.js\' is mocked correctly and the mock provides all necessary exports.');
            } else {
                console.error('FSRS import error in Browser. Check that fsrs.js module is available.');
            }
            throw e;
        }
        
        // Set up grade mapping
        this.gradeToRating = {
            1: this.Rating.Again,  // Incorrect
            2: this.Rating.Again,  // Again (user choice)
            3: this.Rating.Hard,   // Hard
            4: this.Rating.Good,   // Okay/Good
            5: this.Rating.Easy    // Easy
        };
        
        this.initialized = true;
    }

    /**
     * Create a new FSRS card for an unseen skill
     */
    createNewCard() {
        if (!this.fsrsModule) {
            // Return a default card structure if not initialized
            return {
                due: new Date(),
                stability: 0,
                difficulty: 0,
                elapsed_days: 0,
                scheduled_days: 0,
                reps: 0,
                lapses: 0,
                state: 0,
                last_review: new Date()
            };
        }
        return new this.fsrsModule.Card();
    }

    /**
     * Schedule the next review based on the grade received
     * @param {Object} currentState - Current FSRS state {s, d, r, l, next_due}
     * @param {number} grade - Grade received (1-5)
     * @returns {Object} Updated FSRS state
     */
    async scheduleReview(currentState, grade) {
        await this.initialize();
        
        // Convert our state format to FSRS card format
        const card = new this.fsrsModule.Card();
        card.due = new Date(currentState.next_due || new Date());
        card.stability = currentState.s || 0;
        card.difficulty = currentState.d || 0;
        card.elapsed_days = 0;
        card.scheduled_days = 0;
        card.reps = currentState.r || 0;
        card.lapses = currentState.l || 0;
        card.state = this._determineCardState(currentState);
        card.last_review = new Date();

        const rating = this.gradeToRating[grade];
        const schedulingInfo = this.scheduler.repeat(card, new Date());
        const updatedCard = schedulingInfo[rating].card;

        // Convert back to our state format
        return {
            s: updatedCard.stability,
            d: updatedCard.difficulty,
            r: updatedCard.reps,
            l: updatedCard.lapses,
            next_due: updatedCard.due.toISOString()
        };
    }

    /**
     * Calculate damped interval for implicit prerequisite credit
     * @param {Object} prereqState - Prerequisite's current FSRS state
     * @param {number} weight - Weight of the prerequisite relationship (0-1)
     * @param {number} alphaImplicit - Damping factor (default 0.30)
     * @returns {Promise<Object>} Updated prerequisite state with new interval
     */
    async calculateImplicitCredit(prereqState, weight = 1.0, alphaImplicit = 0.30) {
        // Create a virtual "Good" rating for the prerequisite
        const virtualState = await this.scheduleReview(prereqState, 4);
        
        // Calculate the new interval with damping
        const currentDue = new Date(prereqState.next_due);
        const virtualDue = new Date(virtualState.next_due);
        const currentInterval = (currentDue - new Date()) / (1000 * 60 * 60 * 24); // days
        const virtualInterval = (virtualDue - new Date()) / (1000 * 60 * 60 * 24);
        
        // Apply damping formula: max(1, round(alpha * weight * interval))
        const dampedInterval = Math.max(1, Math.round(alphaImplicit * weight * virtualInterval));
        
        // Set new due date
        const newDue = new Date();
        newDue.setDate(newDue.getDate() + dampedInterval);
        
        return {
            ...prereqState,
            next_due: newDue.toISOString()
        };
    }

    /**
     * Check if a skill is overdue (has a pending review)
     * @param {string} nextDue - ISO date string
     * @returns {boolean}
     */
    isOverdue(nextDue) {
        return new Date(nextDue) <= new Date();
    }

    /**
     * Calculate days overdue
     * @param {string} nextDue - ISO date string
     * @returns {number} Days overdue (negative if in future)
     */
    getDaysOverdue(nextDue) {
        const dueDate = new Date(nextDue);
        const now = new Date();
        
        const msPerDay = 1000 * 60 * 60 * 24;
        return (now - dueDate) / msPerDay;
    }

    /**
     * Determine FSRS card state based on our state
     * @private
     */
    _determineCardState(state) {
        if (!state.r || state.r === 0) return 0; // New
        if (state.l > 0) return 3; // Relearning
        return 2; // Review
    }
}