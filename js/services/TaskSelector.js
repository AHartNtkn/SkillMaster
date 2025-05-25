/**
 * TaskSelector Service
 * Implements the task selection and prioritization logic
 */
export class TaskSelector {
    constructor(courseManager) {
        this.courseManager = courseManager;
        this.reviewGapMinutes = 10; // Minimum gap between reviews of same topic
    }

    /**
     * Get the next task for the learner
     * @returns {Object|null} Next task {type: 'review'|'new'|'mixed_quiz', skillId?: string}
     */
    getNextTask() {
        const tasks = this.getTopTasks(1);
        return tasks.length > 0 ? tasks[0] : null;
    }

    /**
     * Get the top N tasks ordered by priority
     * @param {number} max - Maximum number of tasks to return
     * @returns {Array} Array of tasks sorted by priority
     */
    getTopTasks(max = 1) {
        const candidates = this.getCandidates();

        if (candidates.length === 0) {
            return [];
        }

        // Sort by priority (highest first)
        candidates.sort((a, b) => b.priority - a.priority);

        // Apply non-interference rule
        const validCandidates = this.applyNonInterference(candidates);

        return validCandidates.slice(0, max);
    }

    /**
     * Get all candidate tasks
     * @returns {Array} Array of candidate tasks with priorities
     */
    getCandidates() {
        const candidates = [];
        
        // 1. Check for mixed quiz
        if (this.courseManager.prefs.xp_since_mixed_quiz >= 150) {
            candidates.push({
                type: 'mixed_quiz',
                priority: this.calculatePriority('mixed_quiz', null)
            });
        }
        
        // 2. Get overdue reviews
        const overdueSkills = this.courseManager.masteryState.getOverdueSkills();
        for (const skillId of overdueSkills) {
            candidates.push({
                type: 'review',
                skillId,
                priority: this.calculatePriority('review', skillId)
            });
        }
        
        // 3. Get new skills (unseen skills with mastered prerequisites)
        const newSkills = this.getAvailableNewSkills();
        for (const skillId of newSkills) {
            candidates.push({
                type: 'new',
                skillId,
                priority: this.calculatePriority('new', skillId)
            });
        }
        
        return candidates;
    }

    /**
     * Get unseen skills where all prerequisites are mastered
     * @returns {Array<string>} Skill IDs
     */
    getAvailableNewSkills() {
        const available = [];
        
        for (const course of this.courseManager.getAllCourses()) {
            for (const skill of course.getAllSkills()) {
                const state = this.courseManager.masteryState.getSkillState(skill.id);
                
                // Skip if not unseen
                if (state.status !== 'unseen') continue;
                
                // Check if all prerequisites are mastered
                const allPrereqsMastered = skill.prerequisites.every(prereq =>
                    this.courseManager.masteryState.isSkillMastered(prereq.id)
                );
                
                if (allPrereqsMastered) {
                    available.push(skill.id);
                }
            }
        }
        
        return available;
    }

    /**
     * Calculate priority score for a task
     * @param {string} type - Task type
     * @param {string|null} skillId - Skill ID (null for mixed quiz)
     * @returns {number} Priority score
     */
    calculatePriority(type, skillId) {
        // Base scores
        const baseScores = {
            review: 5,
            new: 3,
            mixed_quiz: 2
        };
        
        let priority = baseScores[type] || 0;
        
        if (type === 'review' && skillId) {
            // Add overdue bonus
            const state = this.courseManager.masteryState.getSkillState(skillId);
            if (state.next_due) {
                const daysOverdue = this.courseManager.fsrs.getDaysOverdue(state.next_due);
                const overdueBonus = Math.min(5, Math.floor(daysOverdue));
                priority += overdueBonus;
            }
            
            // Add foundational gap bonus
            const foundationalBonus = this.calculateFoundationalGapBonus(skillId);
            priority += foundationalBonus;
        }
        
        if (skillId) {
            // Add distance bonus
            const lastSkillId = this.courseManager.prefs.last_as;
            const distanceBonus = this.calculateDistanceBonus(skillId, lastSkillId);
            priority += distanceBonus;
        }
        
        return priority;
    }

    /**
     * Calculate foundational gap bonus
     * @param {string} skillId
     * @returns {number} Bonus (0-15)
     */
    calculateFoundationalGapBonus(skillId) {
        let overduePrereqTopics = 0;
        
        // Get skill's prerequisites
        const skill = this.courseManager.getSkill(skillId);
        if (!skill) return 0;
        
        // Check each prerequisite's topic for overdue skills
        const checkedTopics = new Set();
        
        for (const prereq of skill.prerequisites) {
            // Find which topic contains this prerequisite
            for (const course of this.courseManager.getAllCourses()) {
                for (const topic of course.getAllTopics()) {
                    if (topic.skillIds.includes(prereq.id) && !checkedTopics.has(topic.id)) {
                        checkedTopics.add(topic.id);
                        
                        // Check if any skill in this topic is overdue
                        const hasOverdue = topic.skillIds.some(id => {
                            const state = this.courseManager.masteryState.getSkillState(id);
                            return state.next_due && this.courseManager.fsrs.isOverdue(state.next_due);
                        });
                        
                        if (hasOverdue) {
                            overduePrereqTopics++;
                        }
                    }
                }
            }
        }
        
        return 3 * overduePrereqTopics;
    }

    /**
     * Calculate distance bonus based on knowledge graph
     * @param {string} skillId
     * @param {string|null} lastSkillId
     * @returns {number} Bonus (0-5)
     */
    calculateDistanceBonus(skillId, lastSkillId) {
        if (!lastSkillId || skillId === lastSkillId) return 0;
        
        const distance = this.calculateGraphDistance(skillId, lastSkillId);
        return Math.min(5, distance);
    }

    /**
     * Calculate shortest path distance between two skills in the knowledge graph
     * @param {string} skillA
     * @param {string} skillB
     * @returns {number} Distance (5 if disconnected)
     */
    calculateGraphDistance(skillA, skillB) {
        // Simple BFS to find shortest path
        const visited = new Set();
        const queue = [{skill: skillA, distance: 0}];
        
        while (queue.length > 0) {
            const {skill, distance} = queue.shift();
            
            if (skill === skillB) {
                return distance;
            }
            
            if (visited.has(skill) || distance >= 5) {
                continue;
            }
            
            visited.add(skill);
            
            // Get neighbors (prerequisites and dependents)
            const skillObj = this.courseManager.getSkill(skill);
            if (!skillObj) continue;
            
            // Add prerequisites
            for (const prereq of skillObj.prerequisites) {
                queue.push({skill: prereq.id, distance: distance + 1});
            }
            
            // Add dependents
            for (const course of this.courseManager.getAllCourses()) {
                const dependents = course.getDependentSkills(skill);
                for (const dependent of dependents) {
                    queue.push({skill: dependent.id, distance: distance + 1});
                }
            }
        }
        
        return 5; // Disconnected
    }

    /**
     * Apply non-interference rule
     * @param {Array} candidates - Sorted candidates
     * @returns {Array} Filtered candidates
     */
    applyNonInterference(candidates) {
        const lastSkillId = this.courseManager.prefs.last_as;
        if (!lastSkillId) return candidates;
        
        const lastSkill = this.courseManager.getSkill(lastSkillId);
        if (!lastSkill) return candidates;
        
        // Find which topic contains the last skill
        let lastTopic = null;
        for (const course of this.courseManager.getAllCourses()) {
            for (const topic of course.getAllTopics()) {
                if (topic.skillIds.includes(lastSkillId)) {
                    lastTopic = topic;
                    break;
                }
            }
            if (lastTopic) break;
        }
        
        if (!lastTopic) return candidates;
        
        // Check time since last skill
        const lastXPEntry = this.courseManager.xpLog.log
            .filter(entry => entry.source.includes(lastSkillId))
            .pop();
        
        if (!lastXPEntry) return candidates;
        
        const minutesSinceLastSkill = (Date.now() - new Date(lastXPEntry.ts)) / (1000 * 60);
        
        if (minutesSinceLastSkill >= this.reviewGapMinutes) {
            return candidates;
        }
        
        // Filter out candidates from the same topic
        return candidates.filter(candidate => {
            if (candidate.type === 'mixed_quiz') return true;
            
            // Check if candidate is in same topic
            return !lastTopic.skillIds.includes(candidate.skillId);
        });
    }

    /**
     * Get skills eligible for mixed quiz
     * @returns {Array} Array of {skillId, weight}
     */
    getMixedQuizSkills() {
        const eligible = [];
        const now = new Date();
        
        for (const [skillId, state] of this.courseManager.masteryState.skills) {
            // Skip unseen skills
            if (state.status === 'unseen') continue;
            
            // Check if skill has a pending review (next_due <= now)
            if (!state.next_due) continue;
            
            const nextDue = new Date(state.next_due);
            if (nextDue > now) continue; // Not yet due
            
            // Calculate weight based on how overdue it is
            const daysOverdue = this.courseManager.fsrs.getDaysOverdue(state.next_due);
            const weight = Math.max(0.1, daysOverdue); // Minimum weight of 0.1 for skills due today
            
            eligible.push({ skillId, weight });
        }
        
        return eligible;
    }

    /**
     * Get last attempt date for a skill
     * @param {string} skillId
     * @returns {Date|null}
     */
    getLastAttemptDate(skillId) {
        const entries = this.courseManager.xpLog.log
            .filter(entry => entry.source.includes(skillId))
            .sort((a, b) => new Date(b.ts) - new Date(a.ts));
        
        return entries.length > 0 ? new Date(entries[0].ts) : null;
    }

    /**
     * Select questions for mixed quiz
     * @returns {Array} Array of {skillId, questionIndex}
     */
    selectMixedQuizQuestions() {
        const eligible = this.getMixedQuizSkills();
        
        if (eligible.length === 0) {
            return [];
        }
        
        // Weighted random selection
        const selected = [];
        const questions = [];
        
        // Create weighted pool
        const weightedPool = [];
        for (const item of eligible) {
            const weight = Math.max(1, item.weight); // Minimum weight of 1
            for (let i = 0; i < weight; i++) {
                weightedPool.push(item.skillId);
            }
        }
        
        // Select 15 questions
        while (selected.length < 15 && weightedPool.length > 0) {
            const index = Math.floor(Math.random() * weightedPool.length);
            const skillId = weightedPool[index];
            
            // Remove all instances of this skill from the pool
            for (let i = weightedPool.length - 1; i >= 0; i--) {
                if (weightedPool[i] === skillId) {
                    weightedPool.splice(i, 1);
                }
            }
            
            // Get next question index for this skill
            const state = this.courseManager.masteryState.getSkillState(skillId);
            questions.push({
                skillId,
                questionIndex: state.next_q_index || 0
            });
            
            selected.push(skillId);
        }
        
        return questions;
    }
}