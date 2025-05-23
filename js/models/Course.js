/**
 * Course Model
 * Represents a complete course with its topics and atomic skills
 */
export class Course {
    constructor(data) {
        this.format = data.format || 'Catalog-v1';
        this.courseId = data.course_id;
        this.title = data.title;
        this.entryTopics = data.entry_topics || [];
        this.topics = new Map(); // topic_id -> Topic
        this.skills = new Map(); // skill_id -> AtomicSkill
    }

    /**
     * Add a topic to the course
     * @param {Topic} topic
     */
    addTopic(topic) {
        this.topics.set(topic.id, topic);
    }

    /**
     * Add an atomic skill to the course
     * @param {AtomicSkill} skill
     */
    addSkill(skill) {
        this.skills.set(skill.id, skill);
    }

    /**
     * Get all topics
     * @returns {Array<Topic>}
     */
    getAllTopics() {
        return Array.from(this.topics.values());
    }

    /**
     * Get all skills
     * @returns {Array<AtomicSkill>}
     */
    getAllSkills() {
        return Array.from(this.skills.values());
    }

    /**
     * Get topic by ID
     * @param {string} topicId
     * @returns {Topic|null}
     */
    getTopic(topicId) {
        return this.topics.get(topicId) || null;
    }

    /**
     * Get skill by ID
     * @param {string} skillId
     * @returns {AtomicSkill|null}
     */
    getSkill(skillId) {
        return this.skills.get(skillId) || null;
    }

    /**
     * Get entry point skills (skills in entry topics with no prerequisites)
     * @returns {Array<AtomicSkill>}
     */
    getEntrySkills() {
        const entrySkills = [];
        
        for (const topicId of this.entryTopics) {
            const topic = this.getTopic(topicId);
            if (topic) {
                for (const skillId of topic.skillIds) {
                    const skill = this.getSkill(skillId);
                    if (skill && skill.prerequisites.length === 0) {
                        entrySkills.push(skill);
                    }
                }
            }
        }
        
        return entrySkills;
    }

    /**
     * Get skills that have the given skill as a prerequisite
     * @param {string} skillId
     * @returns {Array<AtomicSkill>}
     */
    getDependentSkills(skillId) {
        const dependents = [];
        
        for (const skill of this.skills.values()) {
            if (skill.prerequisites.some(prereq => prereq.id === skillId)) {
                dependents.push(skill);
            }
        }
        
        return dependents;
    }

    /**
     * Check if course has a skill
     * @param {string} skillId
     * @returns {boolean}
     */
    hasSkill(skillId) {
        return this.skills.has(skillId);
    }

    /**
     * Validate the course structure
     * @returns {Object} Validation result {valid: boolean, errors: string[]}
     */
    validate() {
        const errors = [];

        // Check that all entry topics exist
        for (const topicId of this.entryTopics) {
            if (!this.topics.has(topicId)) {
                errors.push(`Entry topic ${topicId} not found`);
            }
        }

        // Check that all skills in topics exist
        for (const topic of this.topics.values()) {
            for (const skillId of topic.skillIds) {
                if (!this.skills.has(skillId)) {
                    errors.push(`Skill ${skillId} referenced in topic ${topic.id} not found`);
                }
            }
        }

        // Check that all prerequisite skills exist
        for (const skill of this.skills.values()) {
            for (const prereq of skill.prerequisites) {
                if (!this.skills.has(prereq.id)) {
                    errors.push(`Prerequisite ${prereq.id} for skill ${skill.id} not found`);
                }
            }
        }

        // Check for cycles in prerequisite graph
        const cycleCheck = this.checkForCycles();
        if (!cycleCheck.acyclic) {
            errors.push(`Prerequisite cycle detected: ${cycleCheck.cycle.join(' -> ')}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check for cycles in the prerequisite graph
     * @returns {Object} {acyclic: boolean, cycle: string[]}
     */
    checkForCycles() {
        const visited = new Set();
        const recursionStack = new Set();
        const path = [];

        const hasCycle = (skillId) => {
            visited.add(skillId);
            recursionStack.add(skillId);
            path.push(skillId);

            const skill = this.getSkill(skillId);
            if (skill) {
                for (const prereq of skill.prerequisites) {
                    if (!visited.has(prereq.id)) {
                        const result = hasCycle(prereq.id);
                        if (result && result.found) {
                            return result;
                        }
                    } else if (recursionStack.has(prereq.id)) {
                        // Found a cycle
                        const cycleStart = path.indexOf(prereq.id);
                        return {
                            found: true,
                            cycle: [...path.slice(cycleStart), prereq.id]
                        };
                    }
                }
            }

            path.pop();
            recursionStack.delete(skillId);
            return false;
        };

        for (const skillId of this.skills.keys()) {
            if (!visited.has(skillId)) {
                const result = hasCycle(skillId);
                if (result && result.found) {
                    return {
                        acyclic: false,
                        cycle: result.cycle
                    };
                }
            }
        }

        return { acyclic: true, cycle: [] };
    }
}

/**
 * Topic Model
 * Represents a collection of related atomic skills
 */
export class Topic {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.skillIds = data.ass || [];
    }
}

/**
 * AtomicSkill Model
 * Represents the smallest unit of learning
 */
export class AtomicSkill {
    constructor(data) {
        this.id = data.id;
        this.title = data.title || data.name; // Support old format
        this.desc = data.desc || data.name; // Fallback to name if no desc
        this.prerequisites = this._normalizePrereqs(data);
    }

    /**
     * Normalize prerequisites to new format
     * @private
     */
    _normalizePrereqs(data) {
        if (data.prereqs && Array.isArray(data.prereqs)) {
            // Check if it's already in new format
            if (data.prereqs.length === 0 || (data.prereqs[0] && typeof data.prereqs[0] === 'object')) {
                return data.prereqs;
            }
            
            // Convert from old format
            const weights = data.weights || {};
            return data.prereqs.map(id => ({
                id,
                weight: weights[id] || 1.0
            }));
        }
        return [];
    }
}