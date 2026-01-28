import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../../shared/services/favorites.service';
import { ShareButtonComponent } from '../../shared/components/share/share-button/share-button.component';
import { ShareData } from '../../shared/services/share.service';

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [CommonModule, ShareButtonComponent],
  templateUrl: './article-details.component.html',
  styleUrl: './article-details.component.css'
})
export class ArticleDetailsComponent implements OnInit, OnDestroy {
  @Input() article: any;
  @Output() close = new EventEmitter<void>();

  constructor(private favoritesService: FavoritesService) { }

  ngOnInit() {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    // Restore scrolling when modal is closed
    document.body.style.overflow = '';
  }

  onClose() {
    this.close.emit();
  }

  toggleFavorite() {
    if (this.article) {
      this.favoritesService.toggleFavorite(this.article.id, 'article').subscribe();
    }
  }

  isFavorite(): boolean {
    return this.article ? this.favoritesService.isFavorite(this.article.id, 'article') : false;
  }

  getShareData(): ShareData {
    const url = `${window.location.origin}/health-articles/${this.article.id}`;
    return {
      title: this.article.title,
      text: `Read this informative article: "${this.article.title}" on HealthConnect.`,
      url: url
    };
  }
}
