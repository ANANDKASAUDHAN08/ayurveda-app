import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AyurvedaService, Herb } from '../../../../shared/services/ayurveda.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-herb-library',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './herb-library.component.html',
    styleUrl: './herb-library.component.css',
    animations: [
        trigger('fadeInUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class HerbLibraryComponent implements OnInit {
    @Input() initialQuery: string = '';
    @Output() herbSelected = new EventEmitter<Herb>();

    herbs: Herb[] = [];
    filteredHerbs: Herb[] = [];
    loading = true;
    searchQuery = '';
    selectedDosha: 'all' | 'Vata' | 'Pitta' | 'Kapha' = 'all';

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 0;
    paginatedHerbs: Herb[] = [];
    pages: number[] = [];

    get showingStart(): number {
        return this.filteredHerbs.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    }

    get showingEnd(): number {
        return Math.min(this.currentPage * this.pageSize, this.filteredHerbs.length);
    }

    get totalResults(): number {
        return this.filteredHerbs.length;
    }

    constructor(private ayurvedaService: AyurvedaService) { }

    ngOnInit(): void {
        this.searchQuery = this.initialQuery;
        this.loadHerbs();
    }

    loadHerbs(): void {
        this.loading = true;
        this.ayurvedaService.getHerbs().subscribe({
            next: (data) => {
                this.herbs = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load herbs:', err);
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        this.filteredHerbs = this.herbs.filter(herb => {
            const matchesSearch = !this.searchQuery ||
                herb.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                herb.scientific_name.toLowerCase().includes(this.searchQuery.toLowerCase());

            const matchesDosha = this.selectedDosha === 'all' ||
                herb.pacify.includes(this.selectedDosha) ||
                herb.tridosha;

            return matchesSearch && matchesDosha;
        });

        this.totalPages = Math.ceil(this.filteredHerbs.length / this.pageSize);
        this.updateVisiblePages();
        this.currentPage = 1;
        this.updatePaginatedHerbs();
    }

    updateVisiblePages(): void {
        const isMobile = window.innerWidth < 640;
        const maxVisible = isMobile ? 3 : 7;
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        this.pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    updatePaginatedHerbs(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        this.paginatedHerbs = this.filteredHerbs.slice(startIndex, startIndex + this.pageSize);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.updatePaginatedHerbs();
        this.updateVisiblePages();
        window.scrollTo({ top: 300, behavior: 'smooth' });
    }

    onSearch(): void {
        this.applyFilters();
    }

    filterByDosha(dosha: 'all' | 'Vata' | 'Pitta' | 'Kapha'): void {
        this.selectedDosha = dosha;
        this.applyFilters();
    }

    selectHerb(herb: Herb): void {
        this.herbSelected.emit(herb);
    }


    getDoshaClass(dosha: string): string {
        switch (dosha.toLowerCase()) {
            case 'vata': return 'bg-blue-100 text-blue-700';
            case 'pitta': return 'bg-orange-100 text-orange-700';
            case 'kapha': return 'bg-emerald-100 text-emerald-700';
            case 'tridosha': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
