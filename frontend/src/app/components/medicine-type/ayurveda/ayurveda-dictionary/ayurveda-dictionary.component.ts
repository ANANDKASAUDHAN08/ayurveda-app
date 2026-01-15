import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MorbidityService, MorbidityCode } from '../../../../shared/services/morbidity.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-ayurveda-dictionary',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ayurveda-dictionary.component.html',
    styleUrls: ['./ayurveda-dictionary.component.css']
})
export class AyurvedaDictionaryComponent implements OnInit {
    codes: MorbidityCode[] = [];
    selectedCode: MorbidityCode | null = null;
    loading = false;
    searchQuery = '';
    currentPage = 1;
    totalPages = 1;
    pageSize = 20;
    totalCodes = 0;

    private searchSubject = new Subject<string>();

    constructor(private morbidityService: MorbidityService) {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.performSearch(query);
        });
    }

    ngOnInit(): void {
        this.loadCodes();
    }

    loadCodes(): void {
        this.loading = true;
        this.morbidityService.getAllCodes(this.currentPage, this.pageSize).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.codes = res.data;
                    this.totalCodes = res.total || 0;
                    this.totalPages = Math.ceil(this.totalCodes / this.pageSize);
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading codes:', err);
                this.loading = false;
            }
        });
    }

    onSearch(query: string): void {
        if (query.length === 0) {
            this.currentPage = 1;
            this.loadCodes();
            return;
        }
        this.searchSubject.next(query);
    }

    performSearch(query: string): void {
        if (!query) return;
        this.loading = true;
        this.morbidityService.searchCodes(query).subscribe({
            next: (res) => {
                if (res.success && res.results) {
                    this.codes = res.results;
                    this.totalPages = 1; // Search results are usually single page
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error searching codes:', err);
                this.loading = false;
            }
        });
    }

    selectCode(code: MorbidityCode): void {
        this.selectedCode = code;
    }

    closeDetails(): void {
        this.selectedCode = null;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadCodes();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadCodes();
        }
    }

    formatTerm(term: string): string {
        if (!term) return '';
        const lower = term.toLowerCase().trim();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    formatOntology(ontology: string): string {
        if (!ontology) return '';

        // Remove technical tags like #san@ and identifiers like #[ED-2]
        let cleaned = ontology
            .replace(/#san@/g, '')
            .replace(/#\[([A-Z0-9-]+)\]/g, ' ($1)')
            .replace(/Classifed/g, 'Classified'); // Fix typo in dataset

        return cleaned.trim();
    }
}
