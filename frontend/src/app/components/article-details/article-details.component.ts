import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-details.component.html',
  styleUrl: './article-details.component.css'
})
export class ArticleDetailsComponent {
  @Input() article: any;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
