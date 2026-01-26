import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AyurvedaMedicineData {
    id: number | string;
    name: string;
    description?: string;
    price?: number | string;
    image_url?: string;
    category?: string;
    benefits?: string;
    is_bestseller?: boolean;
    product_type?: string;
}

@Component({
    selector: 'app-ayurveda-medicine-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ayurveda-medicine-card.component.html',
    styleUrl: './ayurveda-medicine-card.component.css'
})
export class AyurvedaMedicineCardComponent {
    @Input() medicine!: AyurvedaMedicineData;
    @Input() viewMode: 'grid' | 'list' = 'grid';
    @Output() viewDetails = new EventEmitter<AyurvedaMedicineData>();

    onViewDetails(): void {
        this.viewDetails.emit(this.medicine);
    }
}
