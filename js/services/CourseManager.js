import { Course, Topic, AtomicSkill } from '../models/Course.js';
import { MasteryState } from '../models/MasteryState.js';
import { AttemptWindow } from '../models/AttemptWindow.js';
import { StorageService } from './storage.js';
import { FSRSService } from './fsrs.js';

/**
 * CourseManager Service
 * Central manager for all course-related operations
 */
export class CourseManager {
    constructor() {
        this.storage = new StorageService();
        this.fsrs = new FSRSService();
        this.courses = new Map(); // course_id -> Course
        this.masteryState = null;
        this.attemptWindow = null;
        this.prefs = null;
        this.xpLog = null;
    }

    /**
     * Initialize the course manager
     */
    async initialize() {
        // Initialize save data
        this.storage.initializeSaveData();
        
        // Load saved state
        this.masteryState = new MasteryState(this.storage.loadFromLocal('mastery') || {});
        this.attemptWindow = new AttemptWindow(this.storage.loadFromLocal('attempt_window') || {});
        this.prefs = this.storage.loadFromLocal('prefs') || {};
        this.xpLog = this.storage.loadFromLocal('xp') || { format: 'XP-v1', log: [] };
        
        // Load courses
        await this.loadCourses();
    }

    /**
     * Load all available courses
     */
    async loadCourses() {
        try {
            const coursesData = await this.storage.loadJSON('/courses.json');
            
            for (const courseInfo of coursesData.courses) {
                const course = await this.loadCourse(courseInfo.id);
                if (course) {
                    this.courses.set(courseInfo.id, course);
                }
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }

    /**
     * Load a single course
     * @param {string} courseId
     * @returns {Promise<Course|null>}
     */
    async loadCourse(courseId) {
        try {
            // Load catalog
            const catalogPath = `/course/${courseId}/catalog.json`;
            const catalogData = await this.storage.loadJSON(catalogPath);
            const course = new Course(catalogData);
            
            // Load topics
            const topicPromises = [];
            const topicFiles = await this.getTopicFiles(courseId);
            
            for (const topicFile of topicFiles) {
                const topicPath = `/course/${courseId}/topics/${topicFile}`;
                topicPromises.push(this.storage.loadJSON(topicPath));
            }
            
            const topicsData = await Promise.all(topicPromises);
            for (const topicData of topicsData) {
                course.addTopic(new Topic(topicData));
            }
            
            // Load skills
            const skillPromises = [];
            const skillFiles = await this.getSkillFiles(courseId);
            
            for (const skillFile of skillFiles) {
                const skillPath = `/course/${courseId}/skills/${skillFile}`;
                skillPromises.push(this.storage.loadJSON(skillPath));
            }
            
            const skillsData = await Promise.all(skillPromises);
            for (const skillData of skillsData) {
                course.addSkill(new AtomicSkill(skillData));
            }
            
            // Validate course structure
            const validation = course.validate();
            if (!validation.valid) {
                console.error(`Course ${courseId} validation errors:`, validation.errors);
            }
            
            return course;
        } catch (error) {
            console.error(`Error loading course ${courseId}:`, error);
            return null;
        }
    }

    /**
     * Get topic files for a course (hardcoded for now)
     */
    async getTopicFiles(courseId) {
        // In a real implementation, this would scan the directory
        // For now, we'll hardcode based on what we know exists
        if (courseId === 'elementary_arithmetic') {
            return ['EA_T001.json', 'EA_T002.json'];
        }
        return [];
    }

    /**
     * Get skill files for a course (hardcoded for now)
     */
    async getSkillFiles(courseId) {
        if (courseId === 'elementary_arithmetic') {
            return ['EA_AS001.json', 'EA_AS003.json', 'EA_AS004.json', 'EA_AS013.json'];
        }
        return [];
    }

    /**
     * Get all available courses
     * @returns {Array<Course>}
     */
    getAllCourses() {
        return Array.from(this.courses.values());
    }

    /**
     * Get a specific course
     * @param {string} courseId
     * @returns {Course|null}
     */
    getCourse(courseId) {
        return this.courses.get(courseId) || null;
    }

    /**
     * Get an atomic skill by ID
     * @param {string} skillId
     * @returns {AtomicSkill|null}
     */
    getSkill(skillId) {
        for (const course of this.courses.values()) {
            const skill = course.getSkill(skillId);
            if (skill) return skill;
        }
        return null;
    }

    /**
     * Get skill questions
     * @param {string} skillId
     * @returns {Promise<Array>}
     */
    async getSkillQuestions(skillId) {
        const courseId = skillId.split(':')[0].toLowerCase();
        const questionPath = `/course/${courseId}/as_questions/${skillId.replace(':', '_')}.yaml`;
        
        try {
            const data = await this.storage.loadYAML(questionPath);
            return data.pool || [];
        } catch (error) {
            console.error(`Error loading questions for ${skillId}:`, error);
            return [];
        }
    }

    /**
     * Get skill explanation markdown
     * @param {string} skillId
     * @returns {Promise<string>}
     */
    async getSkillExplanation(skillId) {
        const courseId = skillId.split(':')[0].toLowerCase();
        const mdPath = `/course/${courseId}/as_md/${skillId.replace(':', '_')}.md`;
        
        try {
            return await this.storage.loadMarkdown(mdPath);
        } catch (error) {
            console.error(`Error loading explanation for ${skillId}:`, error);
            return '# Explanation not available\n\nThe explanation for this skill could not be loaded.';
        }
    }

    /**
     * Record a skill attempt
     * @param {string} skillId
     * @param {number} grade - FSRS grade (1-5)
     */
    async recordSkillAttempt(skillId, grade) {
        // Update attempt window
        this.attemptWindow.addSkillAttempt(skillId, grade);
        
        // Get current skill state
        const skillState = this.masteryState.getSkillState(skillId);
        
        // Update status if unseen
        if (skillState.status === 'unseen') {
            skillState.status = 'in_progress';
        }
        
        // Update FSRS state
        const fsrsUpdate = await this.fsrs.scheduleReview(skillState, grade);
        Object.assign(skillState, fsrsUpdate);
        
        // Check mastery criteria
        if (this.attemptWindow.checkMasteryCriteria(skillId)) {
            skillState.status = 'mastered';
        }
        
        // Apply implicit credit to prerequisites if grade is 4 or 5
        if (grade >= 4) {
            await this.applyImplicitCredit(skillId);
        }
        
        // Save state
        this.saveState();
    }

    /**
     * Apply implicit credit to prerequisites
     * @param {string} skillId
     */
    async applyImplicitCredit(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) return;
        
        for (const prereq of skill.prerequisites) {
            const prereqState = this.masteryState.getSkillState(prereq.id);
            
            // Only apply credit if prerequisite is not unseen
            if (prereqState.status !== 'unseen') {
                const updatedState = await this.fsrs.calculateImplicitCredit(
                    prereqState,
                    prereq.weight
                );
                Object.assign(prereqState, updatedState);
            }
        }
    }

    /**
     * Add XP
     * @param {number} amount
     * @param {string} source
     */
    addXP(amount, source) {
        const entry = {
            id: this.xpLog.log.length + 1,
            ts: new Date().toISOString(),
            delta: amount,
            source
        };
        
        this.xpLog.log.push(entry);
        this.prefs.xp_since_mixed_quiz += amount;
        
        this.saveState();
    }

    /**
     * Reset XP counter for mixed quiz
     */
    resetMixedQuizXP() {
        this.prefs.xp_since_mixed_quiz = 0;
        this.saveState();
    }

    /**
     * Update last accessed skill
     * @param {string} skillId
     */
    updateLastSkill(skillId) {
        this.prefs.last_as = skillId;
        this.saveState();
    }

    /**
     * Get total XP
     * @returns {number}
     */
    getTotalXP() {
        return this.xpLog.log.reduce((sum, entry) => sum + entry.delta, 0);
    }

    /**
     * Save all state to localStorage
     */
    saveState() {
        this.storage.saveToLocal('mastery', this.masteryState.toJSON());
        this.storage.saveToLocal('attempt_window', this.attemptWindow.toJSON());
        this.storage.saveToLocal('xp', this.xpLog);
        this.storage.saveToLocal('prefs', this.prefs);
    }

    /**
     * Export all data
     * @returns {Object}
     */
    exportData() {
        return this.storage.exportSaveData();
    }

    /**
     * Import data
     * @param {Object} data
     * @returns {boolean}
     */
    importData(data) {
        const success = this.storage.importSaveData(data);
        if (success) {
            // Reload state from storage
            this.masteryState = new MasteryState(this.storage.loadFromLocal('mastery') || {});
            this.attemptWindow = new AttemptWindow(this.storage.loadFromLocal('attempt_window') || {});
            this.prefs = this.storage.loadFromLocal('prefs') || {};
            this.xpLog = this.storage.loadFromLocal('xp') || { format: 'XP-v1', log: [] };
        }
        return success;
    }

    /**
     * Reset progress
     */
    resetProgress() {
        this.storage.resetSaveData();
        this.masteryState = new MasteryState();
        this.attemptWindow = new AttemptWindow();
        this.prefs = this.storage.loadFromLocal('prefs') || {};
        this.xpLog = { format: 'XP-v1', log: [] };
    }
}