import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-details.component.html',
  styleUrl: './article-details.component.css'
})
export class ArticleDetailsComponent implements OnInit, OnDestroy {
  @Input() article: any;
  @Output() close = new EventEmitter<void>();

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
}
