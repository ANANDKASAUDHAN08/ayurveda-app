import { Component, OnInit, OnDestroy, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AyurvedaKnowledgeService, AyurvedaKnowledgeItem } from '../../../../shared/services/ayurveda-knowledge.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'app-ayurveda-quick-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ayurveda-quick-search.component.html',
    styleUrl: './ayurveda-quick-search.component.css'
})
export class AyurvedaQuickSearchComponent implements OnInit, OnDestroy {
    @Output() close = new EventEmitter<void>();
    @Output() search = new EventEmitter<string>();
    @Output() selectItem = new EventEmitter<AyurvedaKnowledgeItem>();
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    query: string = '';
    suggestions: AyurvedaKnowledgeItem[] = [];
    recentSearches: Array<{ term: string, item?: AyurvedaKnowledgeItem }> = [];
    isLoading: boolean = false;

    private searchTerms = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(
        private knowledgeService: AyurvedaKnowledgeService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadRecentSearches();

        this.searchTerms.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((term: string) => {
                if (term.length < 2) {
                    this.isLoading = false;
                    return [[]];
                }
                this.isLoading = true;
                return this.knowledgeService.search(term, 'all');
            }),
            takeUntil(this.destroy$)
        ).subscribe(results => {
            this.suggestions = results.slice(0, 5); // Show only top 5 suggestions
            this.isLoading = false;
        });

        // Auto-focus input
        setTimeout(() => {
            this.searchInput?.nativeElement?.focus();
        }, 100);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onInputChange(): void {
        if (this.query.length < 2) {
            this.suggestions = [];
        }
        this.searchTerms.next(this.query);
    }

    handleEnter(): void {
        if (this.query.trim()) {
            this.performSearch(this.query);
        }
    }

    selectSuggestion(item: AyurvedaKnowledgeItem): void {
        // For herbs, emit the full item so the parent can open the detail modal directly
        if (item.dataType === 'herb') {
            this.addToRecent(item.name || '', item);
            this.selectItem.emit(item);
            this.close.emit();
        } else {
            const searchTerm = item.name || item.disease || item.title || '';
            this.addToRecent(searchTerm);
            this.performSearch(searchTerm);
        }
    }

    performSearch(term: string): void {
        this.addToRecent(term);
        this.search.emit(term);
        this.close.emit();
    }

    selectRecentSearch(recent: { term: string, item?: AyurvedaKnowledgeItem }): void {
        if (recent.item && recent.item.dataType === 'herb') {
            // It's a herb, emit the item for direct modal
            this.selectItem.emit(recent.item);
            this.close.emit();
        } else {
            // Regular search
            this.performSearch(recent.term);
        }
    }

    loadRecentSearches(): void {
        const stored = localStorage.getItem('ayurveda_recent_searches');
        if (stored) {
            this.recentSearches = JSON.parse(stored);
        }
    }

    addToRecent(term: string, item?: AyurvedaKnowledgeItem): void {
        let recent = [...this.recentSearches];
        // Remove duplicates based on term
        recent = recent.filter(r => r.term.toLowerCase() !== term.toLowerCase());
        recent.unshift({ term, item });
        recent = recent.slice(0, 5); // Keep last 5
        this.recentSearches = recent;
        localStorage.setItem('ayurveda_recent_searches', JSON.stringify(recent));
    }

    clearRecent(): void {
        this.recentSearches = [];
        localStorage.removeItem('ayurveda_recent_searches');
    }

    onClose(): void {
        this.close.emit();
    }
}
