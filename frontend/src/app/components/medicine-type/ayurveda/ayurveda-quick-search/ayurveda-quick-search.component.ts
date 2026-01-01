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
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    query: string = '';
    suggestions: AyurvedaKnowledgeItem[] = [];
    recentSearches: string[] = [];
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
        const searchTerm = item.name || item.disease || item.title || '';
        this.performSearch(searchTerm);
    }

    performSearch(term: string): void {
        this.addToRecent(term);
        this.search.emit(term);
        this.close.emit();
    }

    loadRecentSearches(): void {
        const stored = localStorage.getItem('ayurveda_recent_searches');
        if (stored) {
            this.recentSearches = JSON.parse(stored);
        }
    }

    addToRecent(term: string): void {
        let recent = [...this.recentSearches];
        recent = recent.filter(r => r.toLowerCase() !== term.toLowerCase());
        recent.unshift(term);
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
