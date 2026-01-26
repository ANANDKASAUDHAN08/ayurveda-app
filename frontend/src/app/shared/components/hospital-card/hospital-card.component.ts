import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RatingDisplayComponent } from '../rating-display/rating-display.component';
import { getEncyclopediaKey } from '../../utils/specialty-mapping';

@Component({
    selector: 'app-hospital-card',
    standalone: true,
    imports: [CommonModule, RouterModule, RatingDisplayComponent],
    templateUrl: './hospital-card.component.html'
})
export class HospitalCardComponent {
    @Input() hospital: any;
    @Input() isFavorite: boolean = false;

    @Output() toggleFavorite = new EventEmitter<Event>();
    @Output() viewDetails = new EventEmitter<void>();

    onToggleFavorite(event: Event) {
        this.toggleFavorite.emit(event);
    }

    onViewDetails() {
        this.viewDetails.emit();
    }

    formatName(name: string): string {
        if (!name) return '';
        return name.replace(/^"+|"+$/g, '').trim();
    }

    formatLocation(hospital: any): string {
        if (!hospital) return 'Location Verified';

        const city = hospital.city?.toString().trim();
        const state = hospital.state?.toString().trim();
        const location = hospital.location?.toString().trim();

        if (city && state && city.toLowerCase() !== 'null' && state.toLowerCase() !== 'null') {
            return `${city}, ${state}`;
        } else if (state && state.toLowerCase() !== 'null' && state.toLowerCase() !== 'n/a') {
            return state;
        } else if (city && city.toLowerCase() !== 'null' && city.toLowerCase() !== 'n/a') {
            return city;
        } else if (location && location.toLowerCase() !== 'null' && location.toLowerCase() !== 'n/a') {
            return location;
        }

        // Final fallback if address contains a city-like part
        if (hospital.address && typeof hospital.address === 'string') {
            const parts = hospital.address.split(',');
            if (parts.length > 2) {
                return parts[parts.length - 2].trim();
            }
        }

        return 'Location Verified';
    }

    formatAddress(hospital: any): string {
        if (!hospital || !hospital.address) return '';
        let address = hospital.address.replace(/"/g, '').trim();
        if (hospital.name && address.startsWith(hospital.name.replace(/"/g, ''))) {
            address = address.substring(hospital.name.replace(/"/g, '').length).trim();
            if (address.startsWith(',') || address.startsWith('-')) {
                address = address.substring(1).trim();
            }
        }
        return address || 'Address available on request';
    }

    getSpecialtiesList(specialties: string): string[] {
        if (!specialties || typeof specialties !== 'string') return [];
        const sanitized = specialties.trim();
        if (sanitized === '' || sanitized === '[]' || sanitized === 'null') {
            return [];
        }
        return sanitized
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0 && s !== '[]');
    }

    getSpecialtyKey(specialty: string): string | null {
        return getEncyclopediaKey(specialty);
    }
}
