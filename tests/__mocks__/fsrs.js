// Mock FSRS module for testing with Vitest
export const Rating = {
    Again: 1,
    Hard: 2,
    Good: 3,
    Easy: 4
};

export const State = {
    New: 0,
    Learning: 1,
    Review: 2,
    Relearning: 3
};

export const fsrs = (params) => {
    return {
        repeat: (card, reviewDate) => {
            // Simple mock implementation
            const now = reviewDate || new Date();
            
            // Return scheduling info for all ratings
            const schedulingInfo = {};
            
            [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].forEach(rating => {
                // Mock scheduling based on rating
                let interval = 1;
                let stability = card.stability || 1;
                let difficulty = card.difficulty || 5;
                
                if (rating === Rating.Easy) {
                    interval = 0.00001; // Due in ~1 second (for testing)
                    stability = stability * 1.3;
                    difficulty = Math.max(1, difficulty - 0.15);
                } else if (rating === Rating.Good) {
                    interval = 0.000007; // Due in ~0.6 seconds (for testing)
                    stability = stability * 1.2;
                    difficulty = Math.max(1, difficulty - 0.1);
                } else if (rating === Rating.Hard) {
                    interval = 0.000005; // Due in ~0.4 seconds (for testing)
                    stability = stability * 1.1;
                } else { // Again
                    interval = 0.000003; // Due in ~0.25 seconds (for testing)
                    stability = stability * 0.8;
                    difficulty = Math.min(10, difficulty + 0.2);
                }
                
                const nextDue = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
                
                schedulingInfo[rating] = {
                    card: {
                        ...card,
                        due: nextDue,
                        stability: stability,
                        difficulty: difficulty,
                        elapsed_days: 0,
                        scheduled_days: interval,
                        reps: (card.reps || 0) + 1,
                        lapses: rating === Rating.Again ? (card.lapses || 0) + 1 : (card.lapses || 0),
                        state: rating === Rating.Again ? State.Learning : State.Review,
                        last_review: now
                    },
                    log: {
                        rating: rating,
                        state: card.state || State.New,
                        due: card.due || now,
                        stability: card.stability || 1,
                        difficulty: card.difficulty || 5,
                        elapsed_days: 0,
                        scheduled_days: interval,
                        review: now
                    }
                };
            });
            
            return schedulingInfo;
        }
    };
};

export const generatorParameters = () => {
    return {
        request_retention: 0.9,
        maximum_interval: 365,
        w: [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567]
    };
};

export const createEmptyCard = () => {
    return {
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: State.New,
        last_review: null
    };
};

export default { Rating, State, fsrs, generatorParameters, createEmptyCard };