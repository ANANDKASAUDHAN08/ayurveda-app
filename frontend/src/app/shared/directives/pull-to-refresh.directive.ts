import { Directive, ElementRef, EventEmitter, HostListener, Output, Input } from '@angular/core';

@Directive({
  selector: '[appPullToRefresh]',
  standalone: true
})
export class PullToRefreshDirective {
  @Output() refresh = new EventEmitter<void>();
  @Input() pullThreshold = 80; // Distance in pixels to trigger refresh

  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private refreshIndicator: HTMLElement | null = null;

  constructor(private el: ElementRef) {
    this.createRefreshIndicator();
  }

  private createRefreshIndicator(): void {
    this.refreshIndicator = document.createElement('div');
    this.refreshIndicator.className = 'pull-to-refresh-indicator';
    this.refreshIndicator.innerHTML = `
      <div class="refresh-spinner">
        <i class="fas fa-sync-alt"></i>
      </div>
      <span class="refresh-text">Pull to refresh</span>
    `;
    this.refreshIndicator.style.cssText = `
      position: absolute;
      top: -80px;
      left: 0;
      right: 0;
      height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #059669;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      z-index: 1000;
    `;

    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
      .refresh-spinner {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-center;
        font-size: 20px;
      }
      .refresh-spinner.rotating {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);

    const container = this.el.nativeElement;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.insertBefore(this.refreshIndicator, container.firstChild);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    const element = this.el.nativeElement;

    // Only start if scrolled to top
    if (element.scrollTop === 0) {
      this.startY = event.touches[0].clientY;
      this.isPulling = true;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isPulling) return;

    this.currentY = event.touches[0].clientY;
    const distance = this.currentY - this.startY;

    if (distance > 0 && this.refreshIndicator) {
      // Prevent default scroll
      event.preventDefault();

      // Update indicator position
      const pullDistance = Math.min(distance, this.pullThreshold * 1.5);
      this.refreshIndicator.style.top = `${pullDistance - 80}px`;

      // Update text based on distance
      const textEl = this.refreshIndicator.querySelector('.refresh-text');
      if (textEl) {
        textEl.textContent = distance >= this.pullThreshold ? 'Release to refresh' : 'Pull to refresh';
      }

      // Rotate icon based on pull distance
      const spinner = this.refreshIndicator.querySelector('.refresh-spinner i');
      if (spinner instanceof HTMLElement) {
        spinner.style.transform = `rotate(${pullDistance * 2}deg)`;
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(): void {
    if (!this.isPulling) return;

    const distance = this.currentY - this.startY;

    if (distance >= this.pullThreshold && this.refreshIndicator) {
      // Trigger refresh
      const spinner = this.refreshIndicator.querySelector('.refresh-spinner');
      spinner?.classList.add('rotating');

      this.refresh.emit();

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }

      // Reset after animation
      setTimeout(() => {
        this.resetIndicator();
      }, 1000);
    } else {
      this.resetIndicator();
    }

    this.isPulling = false;
    this.startY = 0;
    this.currentY = 0;
  }

  private resetIndicator(): void {
    if (this.refreshIndicator) {
      this.refreshIndicator.style.top = '-80px';
      const spinner = this.refreshIndicator.querySelector('.refresh-spinner');
      spinner?.classList.remove('rotating');
      const spinnerIcon = this.refreshIndicator.querySelector('.refresh-spinner i');
      if (spinnerIcon instanceof HTMLElement) {
        spinnerIcon.style.transform = 'rotate(0deg)';
      }
      const textEl = this.refreshIndicator.querySelector('.refresh-text');
      if (textEl) {
        textEl.textContent = 'Pull to refresh';
      }
    }
  }
}
