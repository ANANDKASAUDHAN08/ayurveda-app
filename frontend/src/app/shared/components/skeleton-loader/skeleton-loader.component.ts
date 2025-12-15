import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css'
})
export class SkeletonLoaderComponent implements OnInit {
  @Input() type: 'card' | 'list' | 'text' | 'circle' = 'card';
  @Input() count: number = 1;

  items: number[] = [];

  ngOnInit() {
    // Ensure count is a valid number
    const safeCount = typeof this.count === 'number' && this.count > 0 ? this.count : 1;
    this.items = Array(safeCount).fill(0).map((_, i) => i);
  }
}