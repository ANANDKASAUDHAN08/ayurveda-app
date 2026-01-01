import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  deltaX: number;
  deltaY: number;
  velocity: number;
}

export interface PullToRefreshEvent {
  distance: number;
  shouldRefresh: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GestureService {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private readonly SWIPE_THRESHOLD = 50; // Minimum distance to be considered a swipe
  private readonly VELOCITY_THRESHOLD = 0.3; // Minimum velocity
  private readonly PULL_THRESHOLD = 80; // Distance to trigger refresh

  constructor() { }

  /**
   * Detect swipe gestures on an element
   */
  detectSwipe(element: HTMLElement): Observable<SwipeEvent> {
    const swipe$ = new Subject<SwipeEvent>();

    const touchStart = (e: TouchEvent) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    };

    const touchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      const deltaTime = touchEndTime - this.touchStartTime;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Calculate velocity (pixels per millisecond)
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

      // Determine if it's a valid swipe
      if (velocity > this.VELOCITY_THRESHOLD || absX > this.SWIPE_THRESHOLD || absY > this.SWIPE_THRESHOLD) {
        let direction: 'left' | 'right' | 'up' | 'down';

        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        swipe$.next({
          direction,
          deltaX,
          deltaY,
          velocity
        });
      }
    };

    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchend', touchEnd, { passive: true });

    return swipe$.asObservable();
  }

  /**
   * Detect pull-to-refresh gesture
   */
  detectPullToRefresh(element: HTMLElement): Observable<PullToRefreshEvent> {
    const pull$ = new Subject<PullToRefreshEvent>();
    let startY = 0;
    let currentY = 0;

    const touchStart = (e: TouchEvent) => {
      // Only start if scrolled to top
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const touchMove = (e: TouchEvent) => {
      if (startY > 0) {
        currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        if (distance > 0) {
          const shouldRefresh = distance > this.PULL_THRESHOLD;
          pull$.next({ distance, shouldRefresh });

          // Prevent default scroll if pulling down
          if (distance > 10) {
            e.preventDefault();
          }
        }
      }
    };

    const touchEnd = () => {
      const distance = currentY - startY;
      if (distance > this.PULL_THRESHOLD) {
        pull$.next({ distance, shouldRefresh: true });
      }
      startY = 0;
      currentY = 0;
    };

    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', touchEnd, { passive: true });

    return pull$.asObservable();
  }

  /**
   * Trigger haptic feedback (if supported)
   */
  hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
    if ('vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
  }

  /**
   * Check if device supports touch
   */
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
