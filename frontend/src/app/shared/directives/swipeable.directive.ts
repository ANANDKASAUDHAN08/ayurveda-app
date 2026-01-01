import { Directive, ElementRef, EventEmitter, HostListener, Output, Input } from '@angular/core';

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  deltaX: number;
  deltaY: number;
}

@Directive({
  selector: '[appSwipeable]',
  standalone: true
})
export class SwipeableDirective {
  @Output() swipeLeft = new EventEmitter<SwipeEvent>();
  @Output() swipeRight = new EventEmitter<SwipeEvent>();
  @Output() swipeUp = new EventEmitter<SwipeEvent>();
  @Output() swipeDown = new EventEmitter<SwipeEvent>();
  @Output() swipe = new EventEmitter<SwipeEvent>();

  @Input() swipeThreshold = 50; // Minimum distance for swipe
  @Input() enableAnimation = true;

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private element: HTMLElement;

  constructor(private el: ElementRef) {
    this.element = this.el.nativeElement;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.enableAnimation) return;

    const currentX = event.changedTouches[0].screenX;
    const deltaX = currentX - this.touchStartX;

    // Add visual feedback
    this.element.style.transform = `translateX(${deltaX * 0.3}px) rotate(${deltaX * 0.05}deg)`;
    this.element.style.transition = 'none';
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;

    // Reset transform with animation
    if (this.enableAnimation) {
      this.element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.element.style.transform = 'translateX(0) rotate(0)';
    }

    this.handleSwipe();
  }

  private handleSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < this.swipeThreshold && absY < this.swipeThreshold) {
      return; // Not a swipe
    }

    let direction: 'left' | 'right' | 'up' | 'down';

    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const swipeEvent: SwipeEvent = {
      direction,
      deltaX,
      deltaY
    };

    // Emit general swipe event
    this.swipe.emit(swipeEvent);

    // Emit specific direction event
    switch (direction) {
      case 'left':
        this.swipeLeft.emit(swipeEvent);
        break;
      case 'right':
        this.swipeRight.emit(swipeEvent);
        break;
      case 'up':
        this.swipeUp.emit(swipeEvent);
        break;
      case 'down':
        this.swipeDown.emit(swipeEvent);
        break;
    }
  }
}
