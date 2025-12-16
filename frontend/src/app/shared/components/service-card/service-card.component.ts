import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

export interface ServiceCardData {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  route: string;
  gradient: string; // e.g., 'from-blue-500 to-blue-600'
}

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.css'
})
export class ServiceCardComponent {
  @Input() service!: ServiceCardData;

  constructor(private router: Router) { }

  navigate() {
    this.router.navigate([this.service.route]);
  }
}