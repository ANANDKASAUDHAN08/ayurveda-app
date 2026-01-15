import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SymptomCheckerService } from '../../shared/services/symptom-checker.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AyurvedaDetailComponent } from '../../components/medicine-type/ayurveda/ayurveda-detail/ayurveda-detail.component';
import { AyurvedaKnowledgeItem } from '../../shared/services/ayurveda-knowledge.service';

@Component({
    selector: 'app-symptom-history',
    standalone: true,
    imports: [CommonModule, RouterModule, AyurvedaDetailComponent],
    templateUrl: './symptom-history.component.html',
    styleUrls: ['./symptom-history.component.css']
})
export class SymptomHistoryComponent implements OnInit {
    history: any[] = [];
    selectedReport: any = null;
    isLoading = false;
    selectedItem: AyurvedaKnowledgeItem | null = null;

    constructor(
        private symptomService: SymptomCheckerService,
        private snackbar: SnackbarService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadHistory();

        // Check if ID is in URL (for deep linking or refresh)
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.viewDetail(params['id']);
            }
        });
    }

    loadHistory() {
        this.isLoading = true;
        this.symptomService.getHistory().subscribe({
            next: (res) => {
                this.history = res.history;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load history:', err);
                this.snackbar.error('Failed to load symptom history');
                this.isLoading = false;
            }
        });
    }

    viewDetail(id: number) {
        this.isLoading = true;
        this.symptomService.getHistoryDetail(id).subscribe({
            next: (res) => {
                this.selectedReport = res;
                this.isLoading = false;
                // Optionally update URL without navigating
                // this.router.navigate(['/symptom-history', id], { replaceUrl: true });
            },
            error: (err) => {
                console.error('Failed to load report details:', err);
                this.snackbar.error('Failed to load report details');
                this.isLoading = false;
            }
        });
    }

    closeDetail() {
        this.selectedReport = null;
        this.router.navigate(['/symptom-history']);
    }

    viewMedicineDetails(medicine: string) {
        this.selectedItem = {
            id: 'history-med',
            name: medicine,
            dataType: 'medicine',
            description: 'Recommendation from Diagnostic History'
        } as AyurvedaKnowledgeItem;
    }

    closeMedicineDetails() {
        this.selectedItem = null;
    }

    getConfidenceClass(confidence: string | number): string {
        const value = parseFloat(confidence.toString());
        if (value >= 80) return 'text-green-600 font-bold';
        if (value >= 50) return 'text-yellow-600 font-bold';
        return 'text-red-600 font-bold';
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
