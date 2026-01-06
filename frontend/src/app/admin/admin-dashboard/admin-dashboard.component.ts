import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../shared/services/admin.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
    stats = {
        featuredDoctors: 0,
        articles: 0,
        hospitals: 0,
        pharmacies: 0
    };

    loading = true;

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.loading = true;

        forkJoin({
            featuredDoctors: this.adminService.getFeaturedDoctors(),
            articles: this.adminService.getHealthArticles(),
            hospitals: this.adminService.getHospitals(),
            pharmacies: this.adminService.getPharmacies()
        }).subscribe({
            next: (results: any) => {
                this.stats.featuredDoctors = results.featuredDoctors?.featuredDoctors?.length || 0;
                this.stats.articles = results.articles?.articles?.length || 0;
                this.stats.hospitals = results.hospitals?.hospitals?.length || 0;
                this.stats.pharmacies = results.pharmacies?.pharmacies?.length || 0;
                setTimeout(() => {
                    this.loading = false;
                }, 1000);
            },
            error: (error) => {
                console.error('Error loading dashboard stats:', error);
                setTimeout(() => {
                    this.loading = false;
                }, 1000);
                // Optional: Show error message to user
            }
        });
    }
}
