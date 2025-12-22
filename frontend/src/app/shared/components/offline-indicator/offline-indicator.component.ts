import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService } from '../../services/offline.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offline-indicator.component.html',
  styleUrl: './offline-indicator.component.css'
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  isOnline = true;
  showToast = false;
  toastMessage = '';
  private subscription?: Subscription;

  constructor(private offlineService: OfflineService) { }

  ngOnInit() {
    // Subscribe to online/offline status
    this.subscription = this.offlineService.isOnline().subscribe(online => {
      const previousStatus = this.isOnline;
      this.isOnline = online;

      // Show toast when status changes
      if (previousStatus !== undefined && previousStatus !== online) {
        this.showStatusToast(online);
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  showStatusToast(online: boolean) {
    this.toastMessage = online
      ? '✅ Back online! Data will be synced.'
      : '📡 You\'re offline. Using cached data.';
    this.showToast = true;

    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  closeToast() {
    this.showToast = false;
  }
}
