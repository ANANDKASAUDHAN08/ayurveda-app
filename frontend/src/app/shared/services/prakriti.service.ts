import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
export interface PrakritiQuestion {
    id: string;
    label: string;
    options: string[];
}

export interface QuizSection {
    title: string;
    description: string;
    questions: PrakritiQuestion[];
}

export interface PrakritiResult {
    dominant: 'Vata' | 'Pitta' | 'Kapha';
    breakdown: {
        vata: number;
        pitta: number;
        kapha: number;
    };
    traits: {
        element: string;
        qualities: string;
        description: string;
        recommendations: string;
        integrative?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class PrakritiService {
    private apiUrl = `${environment.apiUrl}/prakriti`;
    private resultSubject = new BehaviorSubject<PrakritiResult | null>(null);
    public result$ = this.resultSubject.asObservable();

    constructor(private http: HttpClient) {
        // Load existing result from localStorage if available
        const savedResult = localStorage.getItem('ayurveda_prakriti_result');
        if (savedResult) {
            this.resultSubject.next(JSON.parse(savedResult));
        }
    }

    getQuestions(): Observable<{ success: boolean; data: QuizSection[] }> {
        return this.http.get<{ success: boolean; data: QuizSection[] }>(`${this.apiUrl}/questions`);
    }

    evaluate(answers: Record<string, string>): Observable<{ success: boolean; data: PrakritiResult }> {
        return this.http.post<{ success: boolean; data: PrakritiResult }>(`${this.apiUrl}/evaluate`, { answers })
            .pipe(
                tap(response => {
                    if (response.success) {
                        this.saveResult(response.data);
                    }
                })
            );
    }

    private saveResult(result: PrakritiResult): void {
        localStorage.setItem('ayurveda_prakriti_result', JSON.stringify(result));
        this.resultSubject.next(result);
    }

    clearResult(): void {
        localStorage.removeItem('ayurveda_prakriti_result');
        this.resultSubject.next(null);
    }

    getStoredResult(): PrakritiResult | null {
        return this.resultSubject.value;
    }
}
