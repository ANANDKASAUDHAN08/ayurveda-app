import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizSection, PrakritiQuestion } from '../../../../../shared/services/prakriti.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
    selector: 'app-prakriti-questions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './prakriti-questions.component.html',
    styleUrl: './prakriti-questions.component.css',
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
export class PrakritiQuestionsComponent {
    @Input() sections: QuizSection[] = [];
    @Input() currentStep: number = 0;
    @Input() answers: Record<string, string> = {};
    @Input() isLoading: boolean = false;

    @Output() answerSelected = new EventEmitter<{ questionId: string, answer: string }>();
    @Output() next = new EventEmitter<void>();
    @Output() previous = new EventEmitter<void>();
    @Output() submit = new EventEmitter<void>();

    selectAnswer(questionId: string, answer: string): void {
        this.answerSelected.emit({ questionId, answer });
    }

    isSectionComplete(sectionIndex: number): boolean {
        if (!this.sections[sectionIndex]) return false;
        return this.sections[sectionIndex].questions.every(q => this.answers[q.id]);
    }

    onPrev(): void {
        this.previous.emit();
    }

    onNext(): void {
        this.next.emit();
    }

    onSubmit(): void {
        this.submit.emit();
    }
}
