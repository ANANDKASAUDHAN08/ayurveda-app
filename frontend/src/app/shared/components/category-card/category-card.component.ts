import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
export interface CategoryCardData {
  icon: string;
  title: string;
  count?: number;
  badge?: string; // 'New', 'Sale', 'Hot'
  route: string;
  color: string; // e.g., 'bg-blue-100', 'bg-pink-100'
  iconColor: string; // e.g., 'text-blue-600'
  image?: string; // Background image URL
}
@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.css'
})
export class CategoryCardComponent {
  @Input() category!: CategoryCardData;
  constructor(private router: Router) { }
  navigate() {
    this.router.navigate([this.category.route]);
  }
}