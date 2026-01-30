import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../../../shared/services/favorites.service';
import { PharmacyDetailsModalComponent } from '../pharmacy-details-modal/pharmacy-details-modal.component';
import { ShareButtonComponent } from '../../../shared/components/share/share-button/share-button.component';
import { ShareData } from '../../../shared/services/share.service';

@Component({
    selector: 'app-pharmacy-card',
    standalone: true,
    imports: [CommonModule, PharmacyDetailsModalComponent, ShareButtonComponent],
    templateUrl: './pharmacy-card.component.html',
    styleUrl: './pharmacy-card.component.css'
})
export class PharmacyCardComponent {
    @Input() pharmacy!: any;

    showModal = false;

    constructor(private favoritesService: FavoritesService) { }

    toggleFavorite(event: Event) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(this.pharmacy.id, 'pharmacy').subscribe();
    }

    isFavorite(): boolean {
        return this.favoritesService.isFavorite(this.pharmacy.id, 'pharmacy');
    }

    openDetails() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    get shareData(): ShareData {
        return {
            title: this.pharmacy.name || 'Pharmacy',
            text: `Check out ${this.pharmacy.name} in ${this.pharmacy.city || 'your area'}`,
            url: window.location.href
        };
    }
}
