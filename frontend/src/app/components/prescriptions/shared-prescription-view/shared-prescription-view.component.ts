import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionService, ShareLink } from '../../../shared/services/prescription.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
    selector: 'app-shared-prescription-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './shared-prescription-view.component.html',
    styleUrl: './shared-prescription-view.component.css'
})
export class SharedPrescriptionViewComponent implements OnInit {
    loading = true;
    error = '';
    shareToken = '';
    prescription: any = null;
    shareInfo: any = null;
    expired = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private prescriptionService: PrescriptionService,
        private snackbar: SnackbarService
    ) { }

    ngOnInit() {
        this.shareToken = this.route.snapshot.paramMap.get('token') || '';
        if (this.shareToken) {
            this.loadSharedPrescription();
        } else {
            this.error = 'Invalid share link';
            this.loading = false;
        }
    }

    loadSharedPrescription() {
        this.loading = true;
        this.prescriptionService.getSharedPrescription(this.shareToken).subscribe({
            next: (response) => {
                this.prescription = response.prescription;
                this.shareInfo = response.share_info;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading shared prescription:', error);
                if (error.status === 410) {
                    this.expired = true;
                    this.error = 'This share link has expired';
                } else if (error.status === 404) {
                    this.error = 'Invalid or revoked share link';
                } else {
                    this.error = 'Failed to load prescription';
                }
                this.loading = false;
            }
        });
    }

    goToHome() {
        this.router.navigate(['/home']);
    }
}
