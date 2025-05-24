/**
 * LibraryView
 * Displays available courses and their information
 */
export class LibraryView {
    constructor(courseManager) {
        this.courseManager = courseManager;
    }

    render() {
        const courses = this.courseManager.getAllCourses();
        
        return `
            <div class="screen">
                <h2>Course Library</h2>
                
                <div class="course-list">
                    ${courses.map(course => this.renderCourseCard(course)).join('')}
                </div>
                
                ${courses.length === 0 ? `
                    <div class="task-card">
                        <p class="text-secondary">No courses available. Please check your installation.</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderCourseCard(course) {
        const skills = course.getAllSkills();
        const topics = course.getAllTopics();
        
        // Calculate mastered skills
        const masteredSkills = skills.filter(skill => 
            this.courseManager.masteryState.isSkillMastered(skill.id)
        ).length;
        
        // Calculate mastered topics
        const masteredTopics = topics.filter(topic => {
            const topicSkills = skills.filter(skill => 
                topic.skillIds.includes(skill.id)
            );
            return topicSkills.every(skill => 
                this.courseManager.masteryState.isSkillMastered(skill.id)
            );
        }).length;
        
        return `
            <div class="course-card" onclick="app.exploreCourse('${course.courseId}')">
                <div class="course-title">${course.title}</div>
                <div class="course-stats">
                    <span>${topics.length} Topics</span>
                    <span>${skills.length} Skills</span>
                </div>
                <div class="course-stats">
                    <span class="text-success">${masteredTopics}/${topics.length} Topics Mastered</span>
                    <span class="text-success">${masteredSkills}/${skills.length} Skills Mastered</span>
                </div>
            </div>
        `;
    }

    renderCourseDetails(courseId) {
        const course = this.courseManager.getCourse(courseId);
        if (!course) return '';
        
        const topics = course.getAllTopics();
        
        return `
            <div class="screen">
                <div class="learning-header">
                    <button class="btn btn-secondary" onclick="app.showLibrary()">
                        ← Back
                    </button>
                    <h2>${course.title}</h2>
                    <div></div>
                </div>
                
                <div class="course-topics">
                    ${topics.map(topic => this.renderTopicDetails(course, topic)).join('')}
                </div>
            </div>
        `;
    }

    renderTopicDetails(course, topic) {
        const skills = topic.skillIds.map(id => course.getSkill(id)).filter(Boolean);

        return `
            <div class="task-card">
                <h3>${topic.name}</h3>
                <ul class="skill-list">
                    ${skills.map(skill => {
                        const state = this.courseManager.masteryState.getSkillState(skill.id);
                        const statusClass = state.status === 'mastered' ? 'text-success' :
                                          state.status === 'in_progress' ? 'text-warning' :
                                          'text-secondary';
                        const statusText = state.status === 'mastered' ? '✓ Mastered' :
                                         state.status === 'in_progress' ? '● In Progress' :
                                         '○ Not Started';

                        const prereqText = skill.prerequisites.map(pr => {
                            const mastered = this.courseManager.masteryState.isSkillMastered(pr.id);
                            const color = mastered ? 'var(--success-color)' : 'var(--text-secondary)';
                            return `<span style="color: ${color}">${pr.id}</span>`;
                        }).join(', ');

                        const prereqSection = skill.prerequisites.length > 0 ?
                            `<div class="skill-prereqs">Prereqs: ${prereqText}</div>` : '';

                        let reviewInfo = '';
                        if (state.status !== 'unseen' && state.next_due) {
                            const nextDue = new Date(state.next_due);
                            const now = new Date();
                            if (nextDue <= now) {
                                reviewInfo = `<div class="review-info" style="color: var(--error-color)">Review due</div>`;
                            } else {
                                const diffMs = nextDue - now;
                                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                const parts = [];
                                if (days > 0) parts.push(`${days}d`);
                                if (hours > 0) parts.push(`${hours}h`);
                                if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
                                const countdown = parts.join(' ');
                                reviewInfo = `<div class="review-info" style="color: var(--text-secondary)">Next review in ${countdown}</div>`;
                            }
                        }

                        return `
                            <li>
                                <span class="${statusClass}">${statusText}</span>
                                ${skill.id} - ${skill.title}
                                ${prereqSection}
                                ${reviewInfo}
                            </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        `;
    }
}