import MarkdownIt from 'markdown-it';

/**
 * MixedQuizView
 * Handles mixed quiz sessions with questions from multiple mastered skills
 */
const mdParser = new MarkdownIt();
export class MixedQuizView {
    constructor(courseManager, taskSelector) {
        this.courseManager = courseManager;
        this.taskSelector = taskSelector;
        this.quizQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.correctAnswers = 0;
    }

    render() {
        // Initial render shows loading state
        return `
            <div class="screen">
                <div class="mixed-quiz-content">
                    <div class="task-card">
                        <h3>Loading Mixed Quiz...</h3>
                        <p>Preparing questions from multiple skills...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async startMixedQuiz() {
        // Get assembled questions from CourseManager
        const assembledQuestions = this.courseManager.assembleMixedQuiz();
        
        if (assembledQuestions.length === 0) {
            this.showNoQuestionsAvailable();
            return;
        }
        
        // Questions are already loaded and formatted by assembleMixedQuiz
        this.quizQuestions = assembledQuestions.map(q => ({
            skillId: q.skillId,
            question: q,
            questionIndex: q.questionIndex
        }));
        
        // Reset state
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.correctAnswers = 0;
        
        // Show first question
        this.showQuestion();
    }

    showNoQuestionsAvailable() {
        const content = `
            <div class="screen">
                <h2>Mixed Quiz</h2>
                <div class="task-card">
                    <p>No eligible skills for mixed quiz.</p>
                    <p class="text-secondary">
                        Skills must have pending reviews (next_due ≤ now) to appear in mixed quizzes.
                    </p>
                </div>
                <button class="btn btn-primary btn-full" onclick="app.showHome()">
                    Back to Home
                </button>
            </div>
        `;
        
        document.getElementById('main-content').innerHTML = content;
    }

    showQuestion() {
        const quizItem = this.quizQuestions[this.currentQuestionIndex];
        const skill = this.courseManager.getSkill(quizItem.skillId);
        const questionNumber = this.currentQuestionIndex + 1;
        const totalQuestions = this.quizQuestions.length;

        const content = `
            <div class="learning-header">
                <button class="btn btn-secondary" onclick="app.confirmExitQuiz()">
                    ← Exit Quiz
                </button>
                <div>
                    <h3>Mixed Quiz</h3>
                    <div class="text-secondary">${skill.title}</div>
                </div>
                <div class="question-progress">
                    ${questionNumber} / ${totalQuestions}
                </div>
            </div>
            
            <div class="learning-content">
                <div class="question-stem">
                    ${this.renderMarkdown(quizItem.question.stem)}
                </div>
                
                <ul class="choices-list">
                    ${quizItem.question.choices.map((choice, index) => `
                        <li class="choice-item ${this.selectedAnswer === index ? 'selected' : ''}" 
                            onclick="app.mixedQuizView.selectAnswer(${index})"
                            data-index="${index}">
                            <div class="choice-radio"></div>
                            <div class="choice-text">${this.renderMarkdown(choice)}</div>
                        </li>
                    `).join('')}
                </ul>
                
                <button id="submit-answer-btn" class="btn btn-primary btn-full"
                        onclick="app.mixedQuizView.submitAnswer()"
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
        const quizItem = this.quizQuestions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === quizItem.question.correct;
        
        if (isCorrect) {
            this.correctAnswers++;
        }

        this.showFeedback(isCorrect, quizItem.question);
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
                    <button class="rating-btn again" onclick="app.mixedQuizView.rateAndContinue(2)">
                        Again<br><small>(Hardest)</small>
                    </button>
                    <button class="rating-btn hard" onclick="app.mixedQuizView.rateAndContinue(3)">
                        Hard
                    </button>
                    <button class="rating-btn okay" onclick="app.mixedQuizView.rateAndContinue(4)">
                        Okay
                    </button>
                    <button class="rating-btn easy" onclick="app.mixedQuizView.rateAndContinue(5)">
                        Easy
                    </button>
                </div>
            `;
            
            document.querySelector('.feedback').insertAdjacentHTML('afterend', ratingHtml);
        } else {
            // For incorrect, automatically continue with grade 1
            const continueBtn = `
                <button class="btn btn-primary btn-full" onclick="app.mixedQuizView.rateAndContinue(1)">
                    ${this.currentQuestionIndex < this.quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
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
        const quizItem = this.quizQuestions[this.currentQuestionIndex];
        
        // Record the attempt with FSRS
        await this.courseManager.recordSkillAttempt(quizItem.skillId, grade, true);
        
        // Update question index for the skill
        const skillState = this.courseManager.masteryState.getSkillState(quizItem.skillId);
        const questions = this.courseManager.getSkillQuestions(quizItem.skillId);
        skillState.next_q_index = (quizItem.questionIndex + 1) % questions.length;
        
        // Save state after updating question index
        this.courseManager.saveState();
        
        // Move to next question
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.quizQuestions.length) {
            this.finishQuiz();
        } else {
            // Reset for next question
            this.selectedAnswer = null;
            this.isAnswered = false;
            this.showQuestion();
        }
    }

    async finishQuiz() {
        // Reset mixed quiz XP counter and save state
        this.courseManager.resetMixedQuizXP();
        this.courseManager.saveState();
        
        // Show results
        const accuracy = (this.correctAnswers / this.quizQuestions.length * 100).toFixed(1);
        
        // Count unique skills reviewed
        const uniqueSkills = new Set(this.quizQuestions.map(q => q.skillId)).size;
        
        const content = `
            <div class="screen">
                <div class="home-header">
                    <h2>Mixed Quiz Complete!</h2>
                </div>
                
                <div class="task-card">
                    <h3>Results</h3>
                    <p>Questions answered: ${this.quizQuestions.length}</p>
                    <p>Correct answers: ${this.correctAnswers}</p>
                    <p>Accuracy: ${accuracy}%</p>
                    
                    <p class="text-secondary" style="margin-top: 16px;">
                        ${uniqueSkills} skills reviewed
                    </p>
                </div>
                
                <button class="btn btn-primary btn-full" onclick="app.showHome()">
                    Continue
                </button>
            </div>
        `;
        
        document.getElementById('main-content').innerHTML = content;
        
        // Show toast
        this.showToast('Mixed quiz completed!');
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