import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritesService } from '../../shared/services/favorites.service';
import { ShareButtonComponent } from '../../shared/components/share/share-button/share-button.component';
import { ShareData } from '../../shared/services/share.service';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule, ShareButtonComponent],
  templateUrl: './doctor-card.component.html',
  styleUrl: './doctor-card.component.css'
})
export class DoctorCardComponent {
  @Input() doctor: any;
  @Input() showDetailsLink: boolean = true;
  @Input() isOnline: boolean = false; // NEW: Online status
  @Input() isFree: boolean = false; // NEW: Free consultation
  @Input() viewMode: 'grid' | 'list' = 'grid'; // NEW: View mode
  @Output() book = new EventEmitter<any>();
  @Output() viewDetails = new EventEmitter<any>();
  @Output() instantConsult = new EventEmitter<any>(); // NEW: Instant consultation

  constructor(private favoritesService: FavoritesService) { }

  onBook() {
    this.book.emit(this.doctor);
  }

  onViewDetails() {
    this.viewDetails.emit(this.doctor);
  }

  onInstantConsult() {
    this.instantConsult.emit(this.doctor);
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

  getShareData(): ShareData {
    const url = `${window.location.origin}/find-doctors?id=${this.doctor.id}`;
    return {
      title: `Dr. ${this.doctor.name} - ${this.doctor.specialization}`,
      text: `Check out Dr. ${this.doctor.name}, a specialist in ${this.doctor.specialization} with ${this.doctor.experience} years of experience. Available on HealthConnect!`,
      url: url
    };
  }
}
