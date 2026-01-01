import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.css',
  animations: [
    trigger('sheet', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' }))
      ])
    ]),
    trigger('backdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class BottomSheetComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() height: 'auto' | 'half' | 'full' = 'auto';
  @Output() closed = new EventEmitter<void>();

  private startY = 0;
  private currentY = 0;
  private isDragging = false;

  close(): void {
    this.closed.emit();
  }

  onDragStart(event: TouchEvent): void {
    this.startY = event.touches[0].clientY;
    this.isDragging = true;
  }

  onDragMove(event: TouchEvent): void {
    if (!this.isDragging) return;

    this.currentY = event.touches[0].clientY;
    const deltaY = this.currentY - this.startY;

    // Only allow dragging down
    if (deltaY > 0) {
      const sheet = event.currentTarget as HTMLElement;
      sheet.style.transform = `translateY(${deltaY}px)`;
      sheet.style.transition = 'none';
    }
  }

  onDragEnd(event: TouchEvent): void {
    if (!this.isDragging) return;

    const sheet = event.currentTarget as HTMLElement;
    const deltaY = this.currentY - this.startY;

    // Close if dragged down more than 100px
    if (deltaY > 100) {
      this.close();
    } else {
      // Snap back
      sheet.style.transform = 'translateY(0)';
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
    }

    this.isDragging = false;
    this.startY = 0;
    this.currentY = 0;
  }

  getHeightClass(): string {
    switch (this.height) {
      case 'half':
        return 'h-[50vh]';
      case 'full':
        return 'h-[90vh]';
      default:
        return 'max-h-[80vh]';
    }
  }
}
