import { Component, Input, Output, EventEmitter, Renderer2, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { LabTest } from '../types';

@Component({
    selector: 'app-lab-test-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lab-test-modal.component.html',
    styleUrl: './lab-test-modal.component.css'
})
export class LabTestModalComponent implements OnInit, OnDestroy {
    @Input() test!: LabTest;
    @Output() close = new EventEmitter<void>();
    @Output() findLab = new EventEmitter<void>();

    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document
    ) { }

    ngOnInit() {
        // Prevent background scrolling
        this.renderer.addClass(this.document.body, 'overflow-hidden');
    }

    ngOnDestroy() {
        // Restore background scrolling
        this.renderer.removeClass(this.document.body, 'overflow-hidden');
    }

    onClose() {
        this.close.emit();
    }

    onFindLab() {
        this.findLab.emit();
    }

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

    isString(val: any): boolean {
        return typeof val === 'string';
    }
}
