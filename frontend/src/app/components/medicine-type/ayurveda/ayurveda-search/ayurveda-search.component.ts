import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AyurvedaKnowledgeService, AyurvedaKnowledgeItem } from '../../../../shared/services/ayurveda-knowledge.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AyurvedaDetailComponent } from '../ayurveda-detail/ayurveda-detail.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-ayurveda-search',
    standalone: true,
    imports: [CommonModule, FormsModule, AyurvedaDetailComponent],
    templateUrl: './ayurveda-search.component.html',
    styleUrl: './ayurveda-search.component.css'
})
export class AyurvedaSearchComponent implements OnInit {
    @Input() isModal: boolean = true;
    @Input() initialQuery: string = '';
    @Output() close = new EventEmitter<void>();

    searchQuery: string = '';
    activeCategory: string = 'all';
    activeDosha: string = 'all';
    activeSeverity: string = 'all';
    activeSeason: string = 'all';

    allResults: AyurvedaKnowledgeItem[] = [];
    filteredResults: AyurvedaKnowledgeItem[] = [];
    isLoading: boolean = false;
    hasSearched: boolean = false;
    selectedItem: AyurvedaKnowledgeItem | null = null;

    // Sidebar Section States
    sections = {
        categories: true,
        doshas: true,
        severity: true
    };

    private searchTerms = new Subject<string>();

    categories = [
        { id: 'all', label: 'All Intelligence', icon: '🧠' },
        { id: 'knowledge', label: 'Clinical Research', icon: '🔬' },
        { id: 'herb', label: 'Botanical Herbs', icon: '🌿' },
        { id: 'medicine', label: 'Pure Formulations', icon: '🍃' },
        { id: 'allopathy', label: 'Modern Medicine', icon: '💊' },
        { id: 'yoga', label: 'Vedic Yoga', icon: '🧘' },
        { id: 'hosp', label: 'Wellness Centers', icon: '🏥' },
        { id: 'remedy', label: 'Home Rituals', icon: '🏠' }
    ];

    doshas = [
        { id: 'all', label: 'All Doshas' },
        { id: 'Vata', label: 'Vata' },
        { id: 'Pitta', label: 'Pitta' },
        { id: 'Kapha', label: 'Kapha' }
    ];

    severities = [
        { id: 'all', label: 'All Severity' },
        { id: 'Mild', label: 'Mild' },
        { id: 'Moderate', label: 'Moderate' },
        { id: 'Severe', label: 'Severe' }
    ];

    constructor(
        private knowledgeService: AyurvedaKnowledgeService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.searchTerms.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((term: string) => {
                if (!term || term.length < 2) {
                    this.isLoading = false;
                    return of([]);
                }
                this.isLoading = true;
                this.hasSearched = true;
                return this.knowledgeService.search(term, this.activeCategory);
            })
        ).subscribe(results => {
            this.allResults = results;
            this.applyFilters();
            this.isLoading = false;
        });

        // Check for input query
        if (this.initialQuery) {
            this.searchQuery = this.initialQuery;
            this.onSearchChange();
        }

        // Check for query params (fallback/direct access)
        this.route.queryParams.subscribe(params => {
            if (params['q']) {
                this.searchQuery = params['q'];
                this.onSearchChange();
            }
        });
    }

    onSearchChange(): void {
        if (this.searchQuery.length < 2) {
            this.allResults = [];
            this.filteredResults = [];
            this.hasSearched = false;
            return;
        }
        this.searchTerms.next(this.searchQuery);
    }

    setCategory(catId: string): void {
        this.activeCategory = catId;
        this.onSearchChange();
    }

    setDosha(doshaId: string): void {
        this.activeDosha = doshaId;
        this.applyFilters();
    }

    setSeverity(severityId: string): void {
        this.activeSeverity = severityId;
        this.applyFilters();
    }

    applyFilters(): void {
        this.filteredResults = this.allResults.filter(item => {
            // Category filter is already handled by API/Service mapping

            // Dosha filter
            const matchesDosha = this.activeDosha === 'all' ||
                (item.doshas && item.doshas.toLowerCase().includes(this.activeDosha.toLowerCase())) ||
                (item.constitution_prakriti && item.constitution_prakriti.toLowerCase().includes(this.activeDosha.toLowerCase()));

            // Severity filter
            const matchesSeverity = this.activeSeverity === 'all' ||
                (item.severity && item.severity.toLowerCase().includes(this.activeSeverity.toLowerCase()));

            return matchesDosha && matchesSeverity;
        });
    }

    getTypeLabel(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    getIcon(type: string): string {
        const cat = this.categories.find(c => c.id === type);
        return cat ? cat.icon : '✨';
    }

    viewDetails(item: AyurvedaKnowledgeItem): void {
        this.selectedItem = item;
    }

    closeDetails(): void {
        this.selectedItem = null;
    }

    toggleSection(section: 'categories' | 'doshas' | 'severity'): void {
        this.sections[section] = !this.sections[section];
    }

    onClose(): void {
        this.close.emit();
    }
}
