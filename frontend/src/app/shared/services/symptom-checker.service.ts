import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Symptom {
    name: string;
    value: string;
}

export interface DiseasePrediction {
    disease: string;
    confidence: string;
}

export interface TreatmentRecommendation {
    recommendations: any[];
    note: string;
}

export interface FullDiagnosisResponse {
    success: boolean;
    diagnosis: {
        disease: string;
        confidence: string;
        symptomsMatched: number;
    };
    treatments: {
        ayurveda?: any;
        allopathy?: any;
    };
    ayurvedicInsight?: {
        term: string;
        devanagari: string;
        definition?: string;
        clinical_insight?: string;
        namc_id: number;
    } | null;
    treatmentType?: string;
    disclaimer: string;
}

@Injectable({
    providedIn: 'root'
})
export class SymptomCheckerService {
    private apiUrl = `${environment.apiUrl}/symptom-checker`;

    constructor(private http: HttpClient) { }

    getAvailableSymptoms(): Observable<{ success: boolean; symptoms: Symptom[] }> {
        return this.http.get<{ success: boolean; symptoms: Symptom[] }>(`${this.apiUrl}/symptoms`);
    }

    checkSymptoms(symptoms: string[]): Observable<{ success: boolean; possibleDiseases: DiseasePrediction[] }> {
        return this.http.post<{ success: boolean; possibleDiseases: DiseasePrediction[] }>(`${this.apiUrl}/check-symptoms`, { symptoms });
    }

    getFullDiagnosis(symptoms: string[], age?: number, gender?: string, treatmentType: string = 'both'): Observable<FullDiagnosisResponse> {
        return this.http.post<FullDiagnosisResponse>(`${this.apiUrl}/full-diagnosis`, {
            symptoms,
            age,
            gender,
            treatmentType
        });
    }

    getHistory(): Observable<{ success: boolean; history: any[] }> {
        return this.http.get<{ success: boolean; history: any[] }>(`${this.apiUrl}/history`);
    }

    getHistoryDetail(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/history/${id}`);
    }
}
