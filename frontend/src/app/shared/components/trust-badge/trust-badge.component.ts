import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
export interface TrustBadgeData {
  icon: string;
  number: string;
  label: string;
  subtext: string;
  color: string;
}
@Component({
  selector: 'app-trust-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-badge.component.html',
  styleUrl: './trust-badge.component.css'
})
export class TrustBadgeComponent implements OnInit, OnDestroy {
  @Input() badge!: TrustBadgeData;
  @Input() enableAnimation: boolean = true;

  displayNumber: string = '0';
  private animationTimer?: any;
  ngOnInit() {
    if (this.enableAnimation) {
      this.animateNumber();
    } else {
      this.displayNumber = this.badge.number;
    }
  }
  ngOnDestroy() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
  }
  private animateNumber() {
    const numericPart = this.badge.number.match(/\d+/);
    if (!numericPart) {
      this.displayNumber = this.badge.number;
      return;
    }
    const target = parseInt(numericPart[0]);
    const hasPlus = this.badge.number.includes('+');
    const hasStar = this.badge.number.includes('⭐');
    const hasDecimal = this.badge.number.includes('.');

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    this.animationTimer = setInterval(() => {
      current += increment;

      if (current >= target) {
        this.displayNumber = this.formatNumber(target, hasPlus, hasStar, hasDecimal);
        clearInterval(this.animationTimer);
      } else {
        this.displayNumber = this.formatNumber(Math.floor(current), hasPlus, hasStar, hasDecimal);
      }
    }, duration / steps);
  }
  private formatNumber(num: number, hasPlus: boolean, hasStar: boolean, hasDecimal: boolean): string {
    let result = num.toString();

    if (hasDecimal && num === parseInt(this.badge.number)) {
      result = this.badge.number.match(/\d+\.\d+/)?.[0] || result;
    }

    if (hasPlus) result += '+';
    if (hasStar) result += '⭐';

    return result;
  }
}