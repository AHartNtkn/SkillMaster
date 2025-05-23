/**
 * AttemptWindow Model
 * Tracks recent attempts and grades for skills and topics
 */
export class AttemptWindow {
    constructor(data = {}) {
        this.format = data.format || 'Attempts-v1';
        this.skillAttempts = new Map(); // skill_id -> grade[]
        this.topicAttempts = new Map(); // topic_id -> score[]
        
        // Initialize from data
        if (data.ass) {
            for (const [skillId, grades] of Object.entries(data.ass)) {
                this.skillAttempts.set(skillId, grades);
            }
        }
        
        if (data.topics) {
            for (const [topicId, scores] of Object.entries(data.topics)) {
                this.topicAttempts.set(topicId, scores);
            }
        }
    }

    /**
     * Add a skill attempt grade
     * @param {string} skillId
     * @param {number} grade - FSRS grade (1-5)
     */
    addSkillAttempt(skillId, grade) {
        if (!this.skillAttempts.has(skillId)) {
            this.skillAttempts.set(skillId, []);
        }
        
        const attempts = this.skillAttempts.get(skillId);
        attempts.push(grade);
        
        // Keep only the last 10 attempts
        if (attempts.length > 10) {
            attempts.shift();
        }
    }

    /**
     * Add a topic quiz score
     * @param {string} topicId
     * @param {number} score - Quiz score (0-1)
     */
    addTopicQuizScore(topicId, score) {
        if (!this.topicAttempts.has(topicId)) {
            this.topicAttempts.set(topicId, []);
        }
        
        const scores = this.topicAttempts.get(topicId);
        scores.push(score);
        
        // Keep only the last 5 scores
        if (scores.length > 5) {
            scores.shift();
        }
    }

    /**
     * Get recent attempts for a skill
     * @param {string} skillId
     * @returns {Array<number>} Recent grades
     */
    getSkillAttempts(skillId) {
        return this.skillAttempts.get(skillId) || [];
    }

    /**
     * Check if skill meets mastery criteria
     * A skill is mastered when it has been practiced at least 3 times
     * and the last 3 grades are all 5 (Easy)
     * @param {string} skillId
     * @returns {boolean}
     */
    checkMasteryCriteria(skillId) {
        const attempts = this.getSkillAttempts(skillId);
        
        if (attempts.length < 3) {
            return false;
        }
        
        // Check if the last 3 attempts are all grade 5
        const lastThree = attempts.slice(-3);
        return lastThree.every(grade => grade === 5);
    }

    /**
     * Get recent quiz scores for a topic
     * @param {string} topicId
     * @returns {Array<number>} Recent scores
     */
    getTopicScores(topicId) {
        return this.topicAttempts.get(topicId) || [];
    }

    /**
     * Export to JSON format
     * @returns {Object}
     */
    toJSON() {
        const ass = {};
        for (const [skillId, attempts] of this.skillAttempts) {
            ass[skillId] = attempts;
        }
        
        const topics = {};
        for (const [topicId, scores] of this.topicAttempts) {
            topics[topicId] = scores;
        }
        
        return {
            format: this.format,
            ass,
            topics
        };
    }
}