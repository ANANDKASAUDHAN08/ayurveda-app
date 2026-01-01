import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Herb } from '../../../../shared/services/ayurveda.service';

@Component({
    selector: 'app-herb-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './herb-detail.component.html',
    styleUrl: './herb-detail.component.css'
})
export class HerbDetailComponent {
    @Input() herb!: Herb;
    @Output() close = new EventEmitter<void>();

    onClose(): void {
        console.log(this.herb);
        this.close.emit();
        document.body.style.overflow = 'auto';
    }

    getDoshaClass(dosha: string): string {
        switch (dosha.toLowerCase()) {
            case 'vata': return 'bg-blue-100 text-blue-700';
            case 'pitta': return 'bg-orange-100 text-orange-700';
            case 'kapha': return 'bg-emerald-100 text-emerald-700';
            case 'tridosha': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
