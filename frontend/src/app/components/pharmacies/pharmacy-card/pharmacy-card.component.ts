import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../../../shared/services/favorites.service';

@Component({
    selector: 'app-pharmacy-card',
    standalone: true,
    imports: [CommonModule],
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
}
