/**
 * MixedQuizView
 * Handles mixed quiz sessions with questions from multiple mastered skills
 */
export class MixedQuizView {
    constructor(courseManager, taskSelector) {
        this.courseManager = courseManager;
        this.taskSelector = taskSelector;
        this.quizQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.correctAnswers = 0;
        this.skillGrades = new Map(); // skillId -> [grades]
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
        this.skillGrades.clear();
        
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
                
                <button class="btn btn-primary btn-full" 
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
        const submitBtn = document.querySelector('.btn-primary');
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

        // Record grade for the skill
        const grade = isCorrect ? 4 : 1; // Default to "Good" for correct, "Again" for incorrect
        
        if (!this.skillGrades.has(quizItem.skillId)) {
            this.skillGrades.set(quizItem.skillId, []);
        }
        this.skillGrades.get(quizItem.skillId).push(grade);

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

        // Add continue button
        const continueBtn = `
            <button class="btn btn-primary btn-full" onclick="app.mixedQuizView.nextQuestion()">
                ${this.currentQuestionIndex < this.quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
        `;
        document.querySelector('.feedback').insertAdjacentHTML('afterend', continueBtn);

        // Hide submit button
        const submitBtn = document.querySelector('.btn-primary');
        if (submitBtn && submitBtn.textContent === 'Submit Answer') {
            submitBtn.style.display = 'none';
        }

        // Re-render MathJax for solution
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    nextQuestion() {
        const quizItem = this.quizQuestions[this.currentQuestionIndex];
        
        // Update question index for the skill
        const skillState = this.courseManager.masteryState.getSkillState(quizItem.skillId);
        skillState.next_q_index = (quizItem.questionIndex + 1) % 999; // Increment for next time
        
        // Add XP for the question
        this.courseManager.addXP(20, `mixed_quiz_${quizItem.skillId}`);
        
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
        // Record all skill attempts with their grades
        for (const [skillId, grades] of this.skillGrades) {
            // Average the grades for this skill
            const avgGrade = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
            await this.courseManager.recordSkillAttempt(skillId, avgGrade);
        }
        
        // Reset mixed quiz XP counter
        this.courseManager.resetMixedQuizXP();
        
        // Save state
        this.courseManager.saveState();
        
        // Show results
        const accuracy = (this.correctAnswers / this.quizQuestions.length * 100).toFixed(1);
        
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
                        ${this.skillGrades.size} skills reviewed
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
        // Basic markdown rendering
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
}