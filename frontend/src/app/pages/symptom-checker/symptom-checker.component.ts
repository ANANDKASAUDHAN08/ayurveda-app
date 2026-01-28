import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AyurvedaKnowledgeItem } from '../../shared/services/ayurveda-knowledge.service';
import { SymptomCheckerService, Symptom, FullDiagnosisResponse } from '../../shared/services/symptom-checker.service';
import { AyurvedaDetailComponent } from '../../components/medicine-type/ayurveda/ayurveda-detail/ayurveda-detail.component';
import { AuthService } from '../../shared/services/auth.service';
import { ShareButtonComponent } from '../../shared/components/share/share-button/share-button.component';
import { ShareData } from '../../shared/services/share.service';

@Component({
    selector: 'app-symptom-checker',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, AyurvedaDetailComponent, ShareButtonComponent],
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
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.loadAvailableSymptoms();

        // Check for pre-filled symptom from query params
        this.route.queryParams.subscribe(params => {
            if (params['s']) {
                this.searchQuery = params['s'];
            }
        });
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

        // Sync URL for shareability and persistence
        // This ensures the '?s=' parameter matches the current input
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { s: this.searchQuery || null },
            queryParamsHandling: 'merge',
            replaceUrl: true // Don't clutter history for minor refinements
        });

        // We can combine selected tags and manual search
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

    getShareData(): ShareData {
        const symptoms = this.availableSymptoms
            .filter(s => this.selectedSymptomValues.includes(s.value))
            .map(s => s.name)
            .join(', ');
        const disease = this.diagnosis?.diagnosis?.disease;
        const url = window.location.href; // Use full URL with query parameters

        return {
            title: `Symptom Analysis: ${disease}`,
            text: `Analyzed symptoms: ${symptoms || this.searchQuery}. Predicted condition: ${disease}. Checked via HealthConnect Symptom Checker.`,
            url: url
        };
    }
}
