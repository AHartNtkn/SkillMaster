// import MarkdownIt from 'markdown-it';

/**
 * LearningView
 * Handles the learning flow: exposition, questions, feedback, and ratings
 */
const mdParser = new window.markdownit();
export class LearningView {
    constructor(courseManager) {
        this.courseManager = courseManager;
        this.currentSkill = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.correctAnswers = 0;
        this.consecutiveEasy = 0;
        this.grades = [];
        this.pendingSkillId = null;
    }

    render() {
        // Initial render shows loading state
        return `
            <div class="screen">
                <div class="learning-content">
                    <div class="task-card">
                        <h3>Loading...</h3>
                        <p>Preparing skill content...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async startSkill(skillId) {
        this.currentSkill = this.courseManager.getSkill(skillId);
        if (!this.currentSkill) {
            console.error(`Skill ${skillId} not found`);
            return;
        }

        // Load questions
        this.questions = await this.courseManager.getSkillQuestions(skillId);
        
        // Handle missing questions gracefully
        if (!this.questions || this.questions.length === 0) {
            const content = `
                <div class="learning-header">
                    <button class="btn btn-secondary" onclick="app.showHome()">
                        ← Home
                    </button>
                    <div>
                        <div class="skill-id">${skillId}</div>
                        <div class="skill-title">Content Unavailable</div>
                    </div>
                    <div></div>
                </div>
                
                <div class="learning-content">
                    <div class="task-card">
                        <h3>Questions Not Available</h3>
                        <p>The questions for this skill could not be loaded. The skill remains schedulable to avoid breaking prerequisite chains.</p>
                        <button class="btn btn-primary" onclick="app.showHome()">
                            Return to Home
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('main-content').innerHTML = content;
            return;
        }
        
        const skillState = this.courseManager.masteryState.getSkillState(skillId);
        this.currentQuestionIndex = skillState.next_q_index || 0;
        
        // Reset session state
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.correctAnswers = 0;
        this.consecutiveEasy = 0;
        this.grades = [];

        // Update last skill
        this.courseManager.updateLastSkill(skillId);

        // Show exposition if new skill
        if (skillState.status === 'unseen') {
            await this.showExposition();
        } else {
            this.showQuestion();
        }
    }

    async showExposition() {
        const markdown = await this.courseManager.getSkillExplanation(this.currentSkill.id);
        
        const content = `
            <div class="learning-header">
                <button class="btn btn-secondary" onclick="app.showHome()">
                    ← Home
                </button>
                <div>
                    <div class="skill-id">${this.currentSkill.id}</div>
                    <div class="skill-title">${this.currentSkill.title}</div>
                </div>
                <div></div>
            </div>
            
            <div class="learning-content">
                <div class="markdown-content">
                    ${this.renderMarkdown(markdown)}
                </div>
                
                <button class="btn btn-primary btn-full" onclick="app.learningView.showQuestion()">
                    Start Questions
                </button>
            </div>
        `;

        document.getElementById('main-content').innerHTML = content;
        
        // Re-render MathJax
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    showQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0; // Wrap around
        }

        const question = this.questions[this.currentQuestionIndex];
        const questionNumber = this.grades.length + 1;

        const content = `
            <div class="learning-header">
                <button class="btn btn-secondary" onclick="app.confirmExit()">
                    ← Home
                </button>
                <div>
                    <div class="skill-id">${this.currentSkill.id}</div>
                    <button class="btn btn-secondary" onclick="app.learningView.showExposition()">
                        Review Explanation
                    </button>
                </div>
                <div class="question-progress">
                    Question ${questionNumber}
                </div>
            </div>
            
            <div class="learning-content">
                <div class="question-stem">
                    ${this.renderMarkdown(question.stem)}
                </div>
                
                <ul class="choices-list">
                    ${question.choices.map((choice, index) => `
                        <li class="choice-item ${this.selectedAnswer === index ? 'selected' : ''}" 
                            onclick="app.learningView.selectAnswer(${index})"
                            data-index="${index}">
                            <div class="choice-radio"></div>
                            <div class="choice-text">${this.renderMarkdown(choice)}</div>
                        </li>
                    `).join('')}
                </ul>
                
                <button id="submit-answer-btn" class="btn btn-primary btn-full"
                        onclick="app.learningView.submitAnswer()"
                        ${this.selectedAnswer === null ? 'disabled' : ''}>
                    Submit Answer
                </button>
            </div>
        `;

        document.getElementById('main-content').innerHTML = content;
        
        // Re-render MathJax
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    selectAnswer(index) {
        if (this.isAnswered) return;
        
        this.selectedAnswer = index;
        
        // Update UI
        document.querySelectorAll('.choice-item').forEach((item, i) => {
            if (i === index) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    submitAnswer() {
        if (this.selectedAnswer === null || this.isAnswered) return;
        
        this.isAnswered = true;
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correct;
        
        if (isCorrect) {
            this.correctAnswers++;
        }

        this.showFeedback(isCorrect, question);
    }

    showFeedback(isCorrect, question) {
        const feedbackHtml = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="feedback-title">${isCorrect ? 'Correct!' : 'Incorrect'}</div>
                ${question.solution ? `
                    <div class="markdown-content">
                        ${this.renderMarkdown(question.solution)}
                    </div>
                ` : ''}
            </div>
        `;

        // Insert feedback after choices
        const choicesList = document.querySelector('.choices-list');
        choicesList.insertAdjacentHTML('afterend', feedbackHtml);

        // Show rating buttons if correct
        if (isCorrect) {
            const ratingHtml = `
                <div class="fsrs-rating">
                    <button class="rating-btn again" onclick="app.learningView.rateAndContinue(2)">
                        Again<br><small>(Hardest)</small>
                    </button>
                    <button class="rating-btn hard" onclick="app.learningView.rateAndContinue(3)">
                        Hard
                    </button>
                    <button class="rating-btn okay" onclick="app.learningView.rateAndContinue(4)">
                        Okay
                    </button>
                    <button class="rating-btn easy" onclick="app.learningView.rateAndContinue(5)">
                        Easy
                    </button>
                </div>
            `;
            
            document.querySelector('.feedback').insertAdjacentHTML('afterend', ratingHtml);
        } else {
            // For incorrect, automatically continue with grade 1
            const continueBtn = `
                <button class="btn btn-primary btn-full" onclick="app.learningView.rateAndContinue(1)">
                    Next Question
                </button>
            `;
            document.querySelector('.feedback').insertAdjacentHTML('afterend', continueBtn);
        }

        // Hide submit button
        const submitBtn = document.getElementById('submit-answer-btn');
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }

        // Re-render MathJax for solution
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    async rateAndContinue(grade) {
        // Record the grade first
        this.grades.push(grade);
        
        // Update consecutive easy count
        if (grade === 5) {
            this.consecutiveEasy++;
        } else {
            this.consecutiveEasy = 0;
        }
        
        try {
            await this.courseManager.recordSkillAttempt(this.currentSkill.id, grade);
        } catch (error) {
            console.error('Error in rateAndContinue:', error);
            // Show error toast but continue session
            this.showToast('Failed to record skill attempt, but continuing session', 'error');
        }
        
        // Always move to next question regardless of FSRS success/failure
        this.currentQuestionIndex++;
        const skillState = this.courseManager.masteryState.getSkillState(this.currentSkill.id);
        skillState.next_q_index = this.currentQuestionIndex % this.questions.length;
        
        try {
            this.courseManager.saveState();
        } catch (saveError) {
            console.error('Error saving state:', saveError);
            this.showToast('Failed to save progress, but continuing session', 'error');
        }
        
        // Check if session should end
        if (this.shouldEndSession()) {
            this.endSession();
        } else {
            // Reset for next question
            this.selectedAnswer = null;
            this.isAnswered = false;
            this.showQuestion();
        }
    }

    shouldEndSession() {
        // End if achieved two consecutive Easy ratings
        if (this.consecutiveEasy >= 2) {
            return true;
        }
        
        // End if exhausted question pool
        if (this.grades.length >= this.questions.length) {
            return true;
        }
        
        return false;
    }

    endSession() {
        const skillState = this.courseManager.masteryState.getSkillState(this.currentSkill.id);
        const isMastered = skillState.status === 'mastered';
        
        
        const content = `
            <div class="screen">
                <div class="home-header">
                    <h2>Session Complete!</h2>
                </div>
                
                <div class="task-card">
                    <div class="skill-id">${this.currentSkill.id}</div>
                    <div class="skill-title">${this.currentSkill.title}</div>
                    
                    <p>Questions answered: ${this.grades.length}</p>
                    <p>Correct answers: ${this.correctAnswers}</p>
                    
                    ${isMastered ? '<p class="text-success"><strong>Skill Mastered!</strong></p>' : ''}
                </div>
                
                <button class="btn btn-primary btn-full" onclick="app.showHome()">
                    Continue
                </button>
            </div>
        `;
        
        document.getElementById('main-content').innerHTML = content;
        
        // Show toast if mastered
        if (isMastered) {
            this.showToast('Skill mastered!');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    renderMarkdown(text) {
        return mdParser.render(text || '');
    }
}