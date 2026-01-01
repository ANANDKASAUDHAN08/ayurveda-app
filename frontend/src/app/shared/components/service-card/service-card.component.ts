import { Component, Input, ElementRef, ViewChild, HostListener } from '@angular/core';
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
  @ViewChild('cardContent') cardContent!: ElementRef;

  private rect: DOMRect | null = null;
  private mouseX = 0;
  private mouseY = 0;
  public transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  public shineStyle = 'opacity: 0';

  constructor(private router: Router) { }

  navigate() {
    this.router.navigate([this.service.route]);
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.cardContent) {
      this.rect = this.cardContent.nativeElement.getBoundingClientRect();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.rect) return;

    this.mouseX = e.clientX - this.rect.left;
    this.mouseY = e.clientY - this.rect.top;

    const centerX = this.rect.width / 2;
    const centerY = this.rect.height / 2;

    const rotateX = ((this.mouseY - centerY) / centerY) * -10; // Max 10deg
    const rotateY = ((this.mouseX - centerX) / centerX) * 10; // Max 10deg

    this.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Calculate shine position
    const shineX = (this.mouseX / this.rect.width) * 100;
    const shineY = (this.mouseY / this.rect.height) * 100;
    this.shineStyle = `background: radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.3) 0%, transparent 60%); opacity: 1;`;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    this.shineStyle = 'opacity: 0';
    this.rect = null;
  }
}