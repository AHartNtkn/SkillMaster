/**
 * HomeView
 * Displays the dashboard with XP progress, skills due, and next task
 */
export class HomeView {
    constructor(courseManager, taskSelector) {
        this.courseManager = courseManager;
        this.taskSelector = taskSelector;
    }

    render() {
        const totalXP = this.courseManager.getTotalXP();
        const xpSinceMixed = this.courseManager.prefs.xp_since_mixed_quiz || 0;
        const xpProgress = (xpSinceMixed / 150) * 100;
        
        const overdueSkills = this.courseManager.masteryState.getOverdueSkills();
        const tasks = this.taskSelector.getTopTasks(6);
        const nextTask = tasks.shift();
        const additionalTasks = tasks;
        
        return `
            <div class="screen">
                <div class="home-header">
                    <h1>SkillMaster</h1>
                    <p class="text-secondary">Total XP: ${totalXP}</p>
                </div>
                
                <div class="xp-progress">
                    <h3>Progress to Next Mixed Quiz</h3>
                    <p class="text-secondary">${xpSinceMixed} / 150 XP</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${xpProgress}%"></div>
                    </div>
                </div>
                
                <div class="skills-due">
                    <h3>Skills Due for Review</h3>
                    <p class="text-secondary">
                        ${overdueSkills.length === 0 
                            ? 'No skills due for review!' 
                            : `${overdueSkills.length} skill${overdueSkills.length > 1 ? 's' : ''} due`}
                    </p>
                </div>
                
                <div class="next-task">
                    <h3>Next Task</h3>
                    ${this.renderTask(nextTask)}
                </div>
                ${additionalTasks.length > 0 ? `
                <div class="additional-tasks">
                    <h3>Other Options</h3>
                    <div class="task-list">
                        ${additionalTasks.map(t => this.renderTask(t)).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderTask(task) {
        if (!task) {
            return `
                <div class="task-card">
                    <p class="text-secondary">No tasks available. Check the library to explore courses!</p>
                </div>
            `;
        }

        if (task.type === 'mixed_quiz') {
            return `
                <div class="task-card">
                    <div class="skill-title">Mixed Quiz Ready!</div>
                    <p class="text-secondary">Review 15 mastered skills</p>
                    <button class="btn btn-primary btn-full" onclick="app.startMixedQuiz()">
                        START MIXED QUIZ
                    </button>
                </div>
            `;
        }

        const skill = this.courseManager.getSkill(task.skillId);
        if (!skill) return '';

        const buttonText = task.type === 'review' ? 'REVIEW SKILL' : 'START NEW SKILL';
        
        return `
            <div class="task-card">
                <div class="skill-id">${skill.id}</div>
                <div class="skill-title">${skill.title}</div>
                <p class="text-secondary">${skill.desc}</p>
                <button class="btn btn-primary btn-full" onclick="app.startSkill('${skill.id}')">
                    ${buttonText}
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Event listeners will be attached by the main app
    }
}