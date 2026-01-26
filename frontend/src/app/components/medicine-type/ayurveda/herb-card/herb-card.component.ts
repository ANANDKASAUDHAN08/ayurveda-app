import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Herb } from '../../../../shared/services/ayurveda.service';

// Flexible type that works with both full Herb and search result herbs
export interface HerbCardData {
    id: number | string;
    name: string;
    scientific_name?: string;
    image_url?: string;
    description?: string;
    preview?: string;
    tridosha?: boolean;
    pacify?: string[];
    product_type?: string;
}

@Component({
    selector: 'app-herb-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './herb-card.component.html',
    styleUrl: './herb-card.component.css'
})
export class HerbCardComponent {
    @Input() herb!: HerbCardData;
    @Output() herbClick = new EventEmitter<HerbCardData>();

    onClick(): void {
        this.herbClick.emit(this.herb);
    }

    getDoshaClass(dosha: string): string {
        const classes: { [key: string]: string } = {
            'Vata': 'bg-blue-100 text-blue-700',
            'Pitta': 'bg-orange-100 text-orange-700',
            'Kapha': 'bg-emerald-100 text-emerald-700'
        };
        return classes[dosha] || 'bg-gray-100 text-gray-700';
    }
}
