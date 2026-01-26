import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AyurvedaMedicineData } from '../ayurveda-medicine-card/ayurveda-medicine-card.component';

@Component({
    selector: 'app-ayurveda-medicine-detail-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ayurveda-medicine-detail-modal.component.html',
    styleUrl: './ayurveda-medicine-detail-modal.component.css'
})
export class AyurvedaMedicineDetailModalComponent {
    @Input() medicine!: AyurvedaMedicineData;
    @Output() close = new EventEmitter<void>();

    activeTab: 'overview' | 'benefits' | 'usage' = 'overview';

    onClose(): void {
        this.close.emit();
    }

    setTab(tab: any): void {
        this.activeTab = tab;
    }

    get benefitsList(): string[] {
        if (!this.medicine?.benefits) return [];
        return this.medicine.benefits.split('.').map((b: string) => b.trim()).filter((b: string) => b.length > 0);
    }
}
