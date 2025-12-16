import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ContentService } from '../../shared/services/content.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-static-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './static-page.component.html',
    styleUrl: './static-page.component.css'
})
export class StaticPageComponent implements OnInit {
    page: any = null;
    loading = true;
    error = false;

    constructor(
        private router: Router,
        private contentService: ContentService
    ) { }

    ngOnInit() {
        // Load page on init
        this.loadPageFromUrl();

        // Reload if route changes
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.loadPageFromUrl();
        });
    }

    loadPageFromUrl() {
        // Extract slug from current URL (e.g., /privacy-policy -> privacy-policy)
        const slug = this.router.url.split('/').pop() || '';
        if (slug) {
            this.loadPage(slug);
        }
    }

    loadPage(slug: string) {
        this.loading = true;
        this.error = false;
        this.contentService.getStaticPage(slug).subscribe({
            next: (response) => {
                this.page = response.page;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading page:', error);
                this.error = true;
                this.loading = false;
            }
        });
    }

    scrollToSection(sectionId: string) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
