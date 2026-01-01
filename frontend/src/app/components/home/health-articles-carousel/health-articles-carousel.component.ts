import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../../shared/services/favorites.service';

@Component({
  selector: 'app-health-articles-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './health-articles-carousel.component.html',
  styleUrls: ['./health-articles-carousel.component.css']
})
export class HealthArticlesCarouselComponent {
  @Input() articles: any[] = [];
  @Input() loading: boolean = false;
  @Input() showEmptyState: boolean = false;
  @Output() articleSelected = new EventEmitter<any>();

  constructor(private favoritesService: FavoritesService) { }

  // Article Carousel
  articleCarouselIndex = 0;
  articleItemsToShow = 3;

  nextArticle() {
    if (this.articleCarouselIndex < this.articles.length - this.articleItemsToShow) {
      this.articleCarouselIndex++;
    } else {
      this.articleCarouselIndex = 0;
    }
  }

  prevArticle() {
    if (this.articleCarouselIndex > 0) {
      this.articleCarouselIndex--;
    } else {
      this.articleCarouselIndex = Math.max(0, this.articles.length - this.articleItemsToShow);
    }
  }

  getArticleCarouselTransform(): string {
    const itemWidth = 100 / this.articleItemsToShow;
    return `translateX(-${this.articleCarouselIndex * itemWidth}%)`;
  }

  openArticle(article: any) {
    this.articleSelected.emit(article);
  }

  toggleFavorite(event: Event, article: any) {
    event.stopPropagation();
    this.favoritesService.toggleFavorite(article.id, 'article').subscribe();
  }

  isFavorite(articleId: string | number): boolean {
    return this.favoritesService.isFavorite(articleId, 'article');
  }
}
