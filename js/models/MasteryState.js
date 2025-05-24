/**
 * MasteryState Model
 * Manages the learner's progress and FSRS state for all skills and topics
 */
export class MasteryState {
    constructor(data = {}) {
        this.format = data.format || 'Mastery-v2';
        this.skills = new Map(); // skill_id -> SkillState
        this.topics = new Map(); // topic_id -> TopicState
        
        // Initialize from data
        if (data.ass) {
            for (const [skillId, state] of Object.entries(data.ass)) {
                this.skills.set(skillId, new SkillState(skillId, state));
            }
        }
        
        if (data.topics) {
            for (const [topicId, state] of Object.entries(data.topics)) {
                this.topics.set(topicId, new TopicState(topicId, state));
            }
        }
    }

    /**
     * Get skill state, creating if it doesn't exist
     * @param {string} skillId
     * @returns {SkillState}
     */
    getSkillState(skillId) {
        if (!this.skills.has(skillId)) {
            this.skills.set(skillId, new SkillState(skillId));
        }
        return this.skills.get(skillId);
    }

    /**
     * Get topic state, creating if it doesn't exist
     * @param {string} topicId
     * @returns {TopicState}
     */
    getTopicState(topicId) {
        if (!this.topics.has(topicId)) {
            this.topics.set(topicId, new TopicState(topicId));
        }
        return this.topics.get(topicId);
    }

    /**
     * Update skill state
     * @param {string} skillId
     * @param {Object} updates
     */
    updateSkillState(skillId, updates) {
        const state = this.getSkillState(skillId);
        Object.assign(state, updates);
    }

    /**
     * Check if a skill is mastered
     * @param {string} skillId
     * @returns {boolean}
     */
    isSkillMastered(skillId) {
        const state = this.getSkillState(skillId);
        return state.status === 'mastered';
    }

    /**
     * Check if a topic is mastered
     * @param {string} topicId
     * @param {Array<string>} skillIds - All skill IDs in the topic
     * @returns {boolean}
     */
    isTopicMastered(topicId, skillIds) {
        // A topic is mastered when all its skills are mastered
        return skillIds.every(skillId => this.isSkillMastered(skillId));
    }

    /**
     * Get all overdue skills (skills with pending reviews)
     * @returns {Array<string>} Skill IDs that have next_due <= now
     */
    getOverdueSkills() {
        const overdue = [];
        const now = new Date();
        
        for (const [skillId, state] of this.skills) {
            if (state.status !== 'unseen' && state.next_due) {
                const dueDate = new Date(state.next_due);
                if (dueDate <= now) {
                    overdue.push(skillId);
                }
            }
        }
        
        return overdue;
    }

    /**
     * Export to JSON format
     * @returns {Object}
     */
    toJSON() {
        const ass = {};
        for (const [skillId, state] of this.skills) {
            ass[skillId] = state.toJSON();
        }
        
        const topics = {};
        for (const [topicId, state] of this.topics) {
            topics[topicId] = state.toJSON();
        }
        
        return {
            format: this.format,
            ass,
            topics
        };
    }
}

/**
 * Individual skill state
 */
export class SkillState {
    constructor(id, data = {}) {
        this.id = id;
        this.status = data.status || 'unseen'; // unseen, in_progress, mastered
        this.s = data.s || 0; // stability
        this.d = data.d || 0; // difficulty
        this.r = data.r || 0; // reps
        this.l = data.l || 0; // lapses
        this.next_due = data.next_due || null;
        this.next_q_index = data.next_q_index || 0;
    }

    toJSON() {
        return {
            status: this.status,
            s: this.s,
            d: this.d,
            r: this.r,
            l: this.l,
            next_due: this.next_due,
            next_q_index: this.next_q_index
        };
    }
}

/**
 * Individual topic state
 */
export class TopicState {
    constructor(id, data = {}) {
        this.id = id;
        this.status = data.status || 'unseen';
        this.last_quiz_score = data.last_quiz_score || null;
        this.last_quiz_date = data.last_quiz_date || null;
    }

    toJSON() {
        return {
            status: this.status,
            last_quiz_score: this.last_quiz_score,
            last_quiz_date: this.last_quiz_date
        };
    }
}