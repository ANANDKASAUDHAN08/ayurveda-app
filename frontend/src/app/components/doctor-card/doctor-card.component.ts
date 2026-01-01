import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../../shared/services/favorites.service';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-card.component.html',
  styleUrl: './doctor-card.component.css'
})
export class DoctorCardComponent {
  @Input() doctor: any;
  @Input() showDetailsLink: boolean = true;
  @Output() book = new EventEmitter<any>();
  @Output() viewDetails = new EventEmitter<any>();

  constructor(private favoritesService: FavoritesService) { }

  onBook() {
    this.book.emit(this.doctor);
  }

  onViewDetails() {
    this.viewDetails.emit(this.doctor);
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    if (this.doctor) {
      this.favoritesService.toggleFavorite(this.doctor.id, 'doctor').subscribe();
    }
  }

  isFavorite(): boolean {
    return this.doctor ? this.favoritesService.isFavorite(this.doctor.id, 'doctor') : false;
  }
}
