import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabTest } from '../types';

@Component({
    selector: 'app-lab-test-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lab-test-card.component.html',
    styleUrl: './lab-test-card.component.css'
})
export class LabTestCardComponent {
    @Input() test!: LabTest;
    @Output() openDetails = new EventEmitter<LabTest>();

    getDiscountPercentage(): number {
        return Math.round(((this.test.price - this.test.discounted_price) / this.test.price) * 100);
    }

    formatPrice(price: any): string {
        const num = parseFloat(price);
        if (isNaN(num)) return price;

        // If it's a whole number, return it without any decimals
        if (num === Math.floor(num)) return Math.floor(num).toString();

        // Otherwise, truncate to 1 decimal place as requested
        return (Math.floor(num * 10) / 10).toString();
    }

    onOpenDetails() {
        this.openDetails.emit(this.test);
    }
}
