import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AyurvedaKnowledgeService, AyurvedaKnowledgeItem } from '../../../../shared/services/ayurveda-knowledge.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AyurvedaDetailComponent } from '../ayurveda-detail/ayurveda-detail.component';
import { HerbDetailComponent } from '../herb-detail/herb-detail.component';
import { AyurvedaService, Herb } from '../../../../shared/services/ayurveda.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-ayurveda-search',
    standalone: true,
    imports: [CommonModule, FormsModule, AyurvedaDetailComponent, HerbDetailComponent],
    templateUrl: './ayurveda-search.component.html',
    styleUrl: './ayurveda-search.component.css'
})
export class AyurvedaSearchComponent implements OnInit, OnChanges {
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
    selectedHerb: Herb | null = null;
    isHerbLoading: boolean = false;

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
        private ayurvedaService: AyurvedaService,
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

    ngOnChanges(changes: SimpleChanges): void {
        // React to changes in initialQuery input
        if (changes['initialQuery'] && !changes['initialQuery'].firstChange) {
            const newQuery = changes['initialQuery'].currentValue;
            if (newQuery && newQuery !== this.searchQuery) {
                this.searchQuery = newQuery;
                this.onSearchChange();
            }
        }
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
        if (item.dataType === 'herb') {
            this.fetchAndShowHerb(item);
        } else {
            this.selectedItem = item;
        }
    }

    private fetchAndShowHerb(item: AyurvedaKnowledgeItem): void {
        // If it's a numeric ID (backend), fetch full details
        if (typeof item.id === 'number' || (typeof item.id === 'string' && !isNaN(Number(item.id)))) {
            this.isHerbLoading = true;
            this.ayurvedaService.getHerbById(Number(item.id)).subscribe({
                next: (herb) => {
                    this.selectedHerb = herb;
                    this.isHerbLoading = false;
                },
                error: (err) => {
                    console.error('Failed to fetch herb details:', err);
                    this.isHerbLoading = false;
                    // Fallback to basic view if backend fetch fails
                    this.selectedItem = item;
                }
            });
        } else {
            // Local JSON herb mapping
            this.selectedHerb = {
                id: 0,
                name: item.name || item.title || '',
                scientific_name: item.botanicalName || '',
                description: item.description || '',
                preview: item.description || '',
                benefits: Array.isArray(item.benefits) ? item.benefits.join(', ') : (item.benefit || ''),
                usage_instructions: item.usage || '',
                image_url: 'assets/images/herbs/default-herb.jpg',
                link: '',
                pacify: item.doshas ? [item.doshas] : [],
                aggravate: [],
                tridosha: item.doshas?.toLowerCase().includes('tridosha') || false,
                rasa: (item as any).properties?.rasa?.split(',') || [],
                guna: (item as any).properties?.guna?.split(',') || [],
                virya: (item as any).properties?.virya || '',
                vipaka: (item as any).properties?.vipaka || '',
                prabhav: [],
                is_herb_of_month: false
            };
        }
    }

    closeDetails(): void {
        this.selectedItem = null;
        this.selectedHerb = null;
    }

    toggleSection(section: 'categories' | 'doshas' | 'severity'): void {
        this.sections[section] = !this.sections[section];
    }

    onClose(): void {
        this.close.emit();
    }
}
