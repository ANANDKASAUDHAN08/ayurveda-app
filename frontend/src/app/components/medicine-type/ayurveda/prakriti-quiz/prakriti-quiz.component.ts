import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrakritiService, QuizSection, PrakritiResult, PrakritiQuestion } from '../../../../shared/services/prakriti.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Router } from '@angular/router';
import { PrakritiQuestionsComponent } from './prakriti-questions/prakriti-questions.component';

@Component({
    selector: 'app-prakriti-quiz',
    standalone: true,
    imports: [CommonModule, FormsModule, PrakritiQuestionsComponent],
    templateUrl: './prakriti-quiz.component.html',
    styleUrl: './prakriti-quiz.component.css',
    animations: [
        trigger('listAnimation', [
            transition('* <=> *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(30px)' }),
                    stagger('80ms', animate('600ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
                ], { optional: true })
            ])
        ])
    ]
})
export class PrakritiQuizComponent implements OnInit {
    sections: QuizSection[] = [];
    currentStep = 0; // 0 for intro, 1+ for sections, -1 for results
    answers: Record<string, string> = {};
    isLoading = false;
    result: PrakritiResult | null = null;
    quizStarted = false;

    constructor(
        private prakritiService: PrakritiService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadQuestions();
        const existing = this.prakritiService.getStoredResult();
        if (existing) {
            this.result = existing;
            this.currentStep = -1; // Show results immediately if already taken
        }
    }

    loadQuestions(): void {
        this.isLoading = true;
        this.prakritiService.getQuestions().subscribe({
            next: (res: { success: boolean, data: QuizSection[] }) => {
                this.sections = res.data;
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Failed to load quiz:', err);
                this.isLoading = false;
            }
        });
    }

    startQuiz(): void {
        this.quizStarted = true;
        this.currentStep = 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    nextStep(): void {
        if (this.currentStep < this.sections.length) {
            this.currentStep++;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            this.submitQuiz();
        }
    }

    prevStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            this.currentStep = 0;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    selectAnswer(questionId: string, answer: string): void {
        this.answers[questionId] = answer;
    }

    handleAnswerSelected(event: { questionId: string, answer: string }): void {
        this.selectAnswer(event.questionId, event.answer);
    }

    isSectionComplete(sectionIndex: number): boolean {
        if (!this.sections[sectionIndex]) return false;
        return this.sections[sectionIndex].questions.every(q => this.answers[q.id]);
    }

    submitQuiz(): void {
        this.isLoading = true;
        this.prakritiService.evaluate(this.answers).subscribe({
            next: (res: { success: boolean, data: PrakritiResult }) => {
                this.result = res.data;
                this.currentStep = -1;
                this.isLoading = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: (err: any) => {
                console.error('Evaluation failed:', err);
                this.isLoading = false;
            }
        });
    }

    retakeQuiz(): void {
        this.prakritiService.clearResult();
        this.result = null;
        this.answers = {};
        this.currentStep = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    resetToIntro(): void {
        this.currentStep = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    goBack(): void {
        this.router.navigate(['/ayurveda']);
    }
}
