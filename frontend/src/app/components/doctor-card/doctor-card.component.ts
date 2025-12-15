import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-card.component.html'
})
export class DoctorCardComponent {
  @Input() doctor: any;
  @Output() book = new EventEmitter<any>();
  @Output() viewDetails = new EventEmitter<any>();

  onBook() {
    this.book.emit(this.doctor);
  }

  onViewDetails() {
    this.viewDetails.emit(this.doctor);
  }
}
