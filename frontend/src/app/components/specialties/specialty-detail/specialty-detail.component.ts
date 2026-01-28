import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContentService } from '../../../shared/services/content.service';
import { ShareButtonComponent } from '../../../shared/components/share/share-button/share-button.component';
import { ShareData } from '../../../shared/services/share.service';

@Component({
    selector: 'app-specialty-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ShareButtonComponent],
    templateUrl: './specialty-detail.component.html',
    styleUrl: './specialty-detail.component.css'
})
export class SpecialtyDetailComponent implements OnInit {
    specialtyName: string = '';
    details: any = null;
    loading: boolean = true;
    error: boolean = false;

    showMobileMenu: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private contentService: ContentService
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.specialtyName = params['name'];
            this.loadSpecialtyDetails();
        });
    }

    loadSpecialtyDetails(): void {
        this.loading = true;
        this.contentService.getSpecialtyEncyclopedia().subscribe({
            next: (data) => {
                this.details = data[this.specialtyName];
                if (!this.details) {
                    this.error = true;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading specialty:', err);
                this.error = true;
                this.loading = false;
            }
        });
    }

    isAyurvedic(): boolean {
        const ayurvedicList = [
            'Kayachikitsa', 'Shalya_Tantra', 'Shalakya_Tantra', 'Agada_Tantra',
            'Prasuti_Tantra', 'Kaumarabhritya', 'Panchakarma', 'Rasayana', 'Vajikarana', 'Svasthavritta'
        ];
        return ayurvedicList.includes(this.specialtyName);
    }

    toggleMobileMenu(): void {
        this.showMobileMenu = !this.showMobileMenu;
    }

    scrollToSection(sectionId: string): void {
        this.showMobileMenu = false;
        setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
                const offset = 80;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = element.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    getShareData(): ShareData {
        const url = window.location.href;
        return {
            title: `${this.details?.title} - Medical Encyclopedia`,
            text: `Learn about ${this.details?.title} on HealthConnect's Medical Encyclopedia.`,
            url: url
        };
    }
}
