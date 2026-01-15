import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AyurvedaKnowledgeItem } from '../../shared/services/ayurveda-knowledge.service';
import { SymptomCheckerService, Symptom, FullDiagnosisResponse } from '../../shared/services/symptom-checker.service';
import { AyurvedaDetailComponent } from '../../components/medicine-type/ayurveda/ayurveda-detail/ayurveda-detail.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    selector: 'app-symptom-checker',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, AyurvedaDetailComponent],
    templateUrl: './symptom-checker.component.html',
    styleUrls: ['./symptom-checker.component.css']
})
export class SymptomCheckerComponent implements OnInit {
    searchQuery: string = '';
    selectedSymptomValues: string[] = [];
    availableSymptoms: Symptom[] = [];
    diagnosis: FullDiagnosisResponse | null = null;
    isLoadingFlow = false;
    hasSearched = false;
    selectedItem: AyurvedaKnowledgeItem | null = null;
    userAge: number = 25;
    userGender: string = 'Male';
    treatmentType: string = 'both';

    constructor(
        private symptomService: SymptomCheckerService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadAvailableSymptoms();
    }

    loadAvailableSymptoms() {
        this.isLoadingFlow = true;
        this.symptomService.getAvailableSymptoms().subscribe({
            next: (res) => {
                this.availableSymptoms = res.symptoms;
                this.isLoadingFlow = false;
            },
            error: () => {
                this.isLoadingFlow = false;
            }
        });
    }

    toggleSymptom(value: string) {
        const index = this.selectedSymptomValues.indexOf(value);
        if (index > -1) {
            this.selectedSymptomValues.splice(index, 1);
        } else {
            this.selectedSymptomValues.push(value);
        }
    }

    clearAllSymptoms() {
        this.selectedSymptomValues = [];
        this.hasSearched = false;
        this.diagnosis = null;
    }

    isSelected(value: string): boolean {
        return this.selectedSymptomValues.includes(value);
    }

    isSelectionEmpty(): boolean {
        return this.selectedSymptomValues.length === 0 && !this.searchQuery;
    }

    runAnalysis() {
        if (this.isSelectionEmpty()) return;

        this.isLoadingFlow = true;
        this.hasSearched = true;

        // We can combine selected tags and manual search
        // But backend expects keys from data.csv
        // If user typed something, we might try to find a match in availableSymptoms
        let symptomsToProcess = [...this.selectedSymptomValues];
        if (this.searchQuery) {
            const match = this.availableSymptoms.find(s =>
                s.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
            if (match && !symptomsToProcess.includes(match.value)) {
                symptomsToProcess.push(match.value);
            }
        }

        this.symptomService.getFullDiagnosis(symptomsToProcess, this.userAge, this.userGender, this.treatmentType).subscribe({
            next: (res) => {
                this.diagnosis = res;
                this.isLoadingFlow = false;
            },
            error: (err) => {
                console.error('Diagnosis error:', err);
                this.isLoadingFlow = false;
            }
        });
    }

    viewDetails(item: any) {
        this.selectedItem = {
            id: 'temp',
            name: item,
            dataType: 'medicine',
            description: 'Recommendation from Diagnostic Engine'
        } as AyurvedaKnowledgeItem;
    }

    closeDetails() {
        this.selectedItem = null;
    }

    goBack() {
        window.history.back();
    }

    formatTerm(term: string): string {
        if (!term) return '';
        const lower = term.toLowerCase().trim();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    get isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }
}
