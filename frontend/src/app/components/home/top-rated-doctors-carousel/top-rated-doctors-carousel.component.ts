import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-rated-doctors-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-rated-doctors-carousel.component.html',
  styleUrls: ['./top-rated-doctors-carousel.component.css']
})
export class TopRatedDoctorsCarouselComponent {
  @Input() doctors: any[] = [];
  @Input() loading: boolean = false;
  @Input() showEmptyState: boolean = false;
  @Output() doctorSelected = new EventEmitter<any>();
  @Output() searchClicked = new EventEmitter<void>();

  // Carousel properties
  currentCarouselIndex = 0;
  carouselItemsToShow = 4;

  // Drag properties
  isDragging = false;
  startX = 0;
  scrollLeft = 0;

  nextCarousel() {
    if (this.currentCarouselIndex < this.doctors.length - this.carouselItemsToShow) {
      this.currentCarouselIndex++;
    } else {
      this.currentCarouselIndex = 0; // Loop back to start
    }
  }

  prevCarousel() {
    if (this.currentCarouselIndex > 0) {
      this.currentCarouselIndex--;
    } else {
      this.currentCarouselIndex = Math.max(0, this.doctors.length - this.carouselItemsToShow);
    }
  }

  getCarouselTransform(): string {
    const itemWidth = 100 / this.carouselItemsToShow;
    return `translateX(-${this.currentCarouselIndex * itemWidth}%)`;
  }

  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.pageX;
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX;
    const walk = (x - this.startX) * 2;

    if (walk > 50) {
      this.prevCarousel();
      this.isDragging = false;
    } else if (walk < -50) {
      this.nextCarousel();
      this.isDragging = false;
    }
  }

  onDragEnd() {
    this.isDragging = false;
  }

  openDoctorDetails(doctor: any) {
    this.doctorSelected.emit(doctor);
  }

  trackByDoctorId(index: number, doctor: any): number {
    return doctor.id;
  }
}
