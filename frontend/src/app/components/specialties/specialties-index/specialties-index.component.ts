import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../../shared/services/content.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-specialties-index',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './specialties-index.component.html',
    styleUrl: './specialties-index.component.css'
})
export class SpecialtiesIndexComponent implements OnInit {
    specialties: any = {};
    specialtyKeys: string[] = [];
    filteredKeys: string[] = [];
    searchQuery: string = '';
    loading: boolean = true;

    // Filters and Sorting
    selectedCategory: string = 'all';
    sortBy: string = 'asc';

    // Pagination
    itemsPerPage: number = 8;
    modernPage: number = 1;
    ayurvedicPage: number = 1;

    ayurvedicSpecialtiesSet = new Set([
        'Kayachikitsa', 'Shalya_Tantra', 'Shalakya_Tantra', 'Agada_Tantra',
        'Prasuti_Tantra', 'Kaumarabhritya', 'Panchakarma', 'Rasayana', 'Vajikarana', 'Svasthavritta'
    ]);

    constructor(private contentService: ContentService) { }

    ngOnInit(): void {
        this.contentService.getSpecialtyEncyclopedia().subscribe({
            next: (data) => {
                this.specialties = data;
                this.specialtyKeys = Object.keys(data);
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading specialties:', err);
                this.loading = false;
            }
        });
    }

    onSearch(): void {
        this.modernPage = 1;
        this.ayurvedicPage = 1;
        this.applyFilters();
    }

    applyFilters(): void {
        let keys = [...this.specialtyKeys];

        // Search Filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            keys = keys.filter(key =>
                this.specialties[key].title.toLowerCase().includes(query) ||
                key.toLowerCase().includes(query)
            );
        }

        // Category Filter
        if (this.selectedCategory !== 'all') {
            keys = keys.filter(key => {
                const isAyurvedic = this.isAyurvedic(key);
                return this.selectedCategory === 'ayurvedic' ? isAyurvedic : !isAyurvedic;
            });
        }

        // Sorting
        keys.sort((a, b) => {
            const titleA = this.specialties[a].title.toLowerCase();
            const titleB = this.specialties[b].title.toLowerCase();
            return this.sortBy === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
        });

        this.filteredKeys = keys;
    }

    isAyurvedic(key: string): boolean {
        return this.ayurvedicSpecialtiesSet.has(key);
    }

    getModernSpecialties(): string[] {
        return this.filteredKeys.filter(key => !this.isAyurvedic(key));
    }

    getAyurvedicSpecialties(): string[] {
        return this.filteredKeys.filter(key => this.isAyurvedic(key));
    }

    getPaginatedModern(): string[] {
        const specs = this.getModernSpecialties();
        const start = (this.modernPage - 1) * this.itemsPerPage;
        return specs.slice(start, start + this.itemsPerPage);
    }

    getPaginatedAyurvedic(): string[] {
        const specs = this.getAyurvedicSpecialties();
        const start = (this.ayurvedicPage - 1) * this.itemsPerPage;
        return specs.slice(start, start + this.itemsPerPage);
    }

    getTotalPages(count: number): number {
        return Math.ceil(count / this.itemsPerPage);
    }

    nextPage(type: 'modern' | 'ayurvedic'): void {
        if (type === 'modern') {
            if (this.modernPage < this.getTotalPages(this.getModernSpecialties().length)) {
                this.modernPage++;
            }
        } else {
            if (this.ayurvedicPage < this.getTotalPages(this.getAyurvedicSpecialties().length)) {
                this.ayurvedicPage++;
            }
        }
    }

    prevPage(type: 'modern' | 'ayurvedic'): void {
        if (type === 'modern') {
            if (this.modernPage > 1) {
                this.modernPage--;
            }
        } else {
            if (this.ayurvedicPage > 1) {
                this.ayurvedicPage--;
            }
        }
    }
}
