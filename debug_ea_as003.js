/**
 * Debug script to check why EA:AS003 is not available as a new task
 */
import { CourseManager } from './js/services/CourseManager.js';
import { TaskSelector } from './js/services/TaskSelector.js';

async function debugEA003() {
    console.log('=== Debugging EA:AS003 availability ===\n');
    
    const courseManager = new CourseManager();
    await courseManager.initialize();
    
    const taskSelector = new TaskSelector(courseManager);
    
    // 1. Check if EA:AS003 exists
    const skill = courseManager.getSkill('EA:AS003');
    console.log('1. EA:AS003 skill object:', skill);
    if (!skill) {
        console.log('ERROR: EA:AS003 skill not found!');
        return;
    }
    
    console.log('   Prerequisites:', skill.prerequisites);
    console.log('   Title:', skill.title);
    console.log('   Description:', skill.desc);
    
    // 2. Check the skill's current state
    const state = courseManager.masteryState.getSkillState('EA:AS003');
    console.log('\n2. EA:AS003 current state:', state);
    
    // 3. Check prerequisites status
    console.log('\n3. Prerequisites check:');
    if (skill.prerequisites.length === 0) {
        console.log('   No prerequisites - should be available as entry skill');
    } else {
        for (const prereq of skill.prerequisites) {
            const prereqState = courseManager.masteryState.getSkillState(prereq.id);
            const isMastered = courseManager.masteryState.isSkillMastered(prereq.id);
            console.log(`   ${prereq.id}: status=${prereqState.status}, mastered=${isMastered}`);
        }
    }
    
    // 4. Get all available new skills
    console.log('\n4. All available new skills:');
    const availableNew = taskSelector.getAvailableNewSkills();
    console.log('   Available new skills:', availableNew);
    console.log('   EA:AS003 included?', availableNew.includes('EA:AS003'));
    
    // 5. Check all candidates
    console.log('\n5. All task candidates:');
    const candidates = taskSelector.getCandidates();
    console.log('   Candidates:', candidates.map(c => ({type: c.type, skillId: c.skillId, priority: c.priority})));
    
    // 6. Get next task
    console.log('\n6. Next task selection:');
    const nextTask = taskSelector.getNextTask();
    console.log('   Next task:', nextTask);
    
    // 7. Check all EA skills and their states
    console.log('\n7. All EA skills overview:');
    const eaCourse = courseManager.getAllCourses().find(c => c.courseId === 'EA');
    if (eaCourse) {
        for (const skill of eaCourse.getAllSkills()) {
            const state = courseManager.masteryState.getSkillState(skill.id);
            console.log(`   ${skill.id}: status=${state.status}, prereqs=${skill.prerequisites.length}`);
        }
    }
}

debugEA003().catch(console.error);