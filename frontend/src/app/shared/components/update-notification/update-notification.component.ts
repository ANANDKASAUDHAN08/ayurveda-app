import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-update-notification',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="update-notification-overlay">
      <div class="update-notification-card">
        <div class="update-icon">🎉</div>
        <h3 class="update-title">New Version Available!</h3>
        <p class="update-message">
          A new version of the app is ready. Update now to get the latest features and improvements.
        </p>
        <div class="update-actions">
          <button class="btn-update" (click)="onUpdate()">
            Update Now
          </button>
          <button class="btn-later" (click)="onLater()">
            Later
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .update-notification-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .update-notification-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .update-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      animation: bounce 0.6s ease-in-out;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .update-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #059669;
      margin: 0 0 0.75rem 0;
    }

    .update-message {
      color: #6b7280;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .update-actions {
      display: flex;
      gap: 0.75rem;
      flex-direction: column;
    }

    .btn-update,
    .btn-later {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-update {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-update:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    .btn-later {
      background: #f3f4f6;
      color: #6b7280;
    }

    .btn-later:hover {
      background: #e5e7eb;
    }

    @media (max-width: 640px) {
      .update-notification-card {
        padding: 1.5rem;
      }

      .update-title {
        font-size: 1.25rem;
      }
    }
  `]
})
export class UpdateNotificationComponent {
    @Output() update = new EventEmitter<void>();
    @Output() dismiss = new EventEmitter<void>();

    onUpdate() {
        this.update.emit();
    }

    onLater() {
        this.dismiss.emit();
    }
}
