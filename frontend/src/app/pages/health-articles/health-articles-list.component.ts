import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContentService, Article } from '../../shared/services/content.service';
import { FavoritesService } from '../../shared/services/favorites.service';
import { ArticleDetailsComponent } from '../../components/article-details/article-details.component';

@Component({
    selector: 'app-health-articles-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ArticleDetailsComponent],
    templateUrl: './health-articles-list.component.html',
    styleUrl: './health-articles-list.component.css'
})
export class HealthArticlesListComponent implements OnInit {
    articles: any[] = [];
    filteredArticles: any[] = [];
    loading = true;
    searchQuery = '';
    selectedCategory = 'All';
    categories: string[] = ['All'];

    // For modal view (syncing with home behavior)
    showArticleModal = false;
    selectedArticle: any = null;

    constructor(
        private contentService: ContentService,
        private favoritesService: FavoritesService
    ) { }

    ngOnInit(): void {
        this.loadArticles();
    }

    loadArticles(): void {
        this.loading = true;
        this.contentService.getHealthArticles().subscribe({
            next: (response) => {
                this.articles = response.articles || [];
                this.extractCategories();
                this.applyFilters();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading articles:', error);
                this.loading = false;
            }
        });
    }

    extractCategories(): void {
        const rawCategories = this.articles.map(a => a.category);
        this.categories = ['All', ...new Set(rawCategories)];
    }

    applyFilters(): void {
        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                article.excerpt.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesCategory = this.selectedCategory === 'All' || article.category === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    setCategory(category: string): void {
        this.selectedCategory = category;
        this.applyFilters();
    }

    openArticle(article: any): void {
        this.selectedArticle = article;
        this.showArticleModal = true;
    }

    closeArticle(): void {
        this.showArticleModal = false;
        this.selectedArticle = null;
    }

    toggleFavorite(event: Event, article: Article) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(article.id, 'article').subscribe();
    }

    isFavorite(articleId: string | number): boolean {
        return this.favoritesService.isFavorite(articleId, 'article');
    }
}
