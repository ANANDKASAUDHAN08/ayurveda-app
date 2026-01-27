import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: Notification[] = [];
  showDropdown = false;
  loading = false;
  private lastBackendNotifications: Notification[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    public notificationService: NotificationService,
    private elementRef: ElementRef
  ) { }

  ngOnInit() {
    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Load initial notifications
    this.loadRecentNotifications();

    // Subscribe to local notifications to ensure immediate updates
    this.subscriptions.push(
      this.notificationService.localNotifications$.subscribe(() => {
        this.updateNotificationList(this.lastBackendNotifications);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      // Refresh unread count immediately
      this.notificationService.refreshUnreadCount();
      this.loadRecentNotifications();
    }
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  loadRecentNotifications() {
    // Only show loading spinner if we have no notifications yet
    if (this.notifications.length === 0) {
      this.loading = true;
    }

    // Refresh the list immediately using current local notifications
    this.updateNotificationList(this.lastBackendNotifications);

    this.notificationService.getNotifications({ limit: 5 }).subscribe({
      next: (response) => {
        this.lastBackendNotifications = response.notifications;
        this.updateNotificationList(this.lastBackendNotifications);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        // Even if backend fails, we've already shown the local ones
        this.loading = false;
      }
    });
  }

  private updateNotificationList(backendNotifications: Notification[]) {
    const localNotifications = this.notificationService.getLocalNotifications();

    // Merge and sort by date
    const allNotifications = [...localNotifications, ...backendNotifications];
    this.notifications = allNotifications
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  markAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    if (!notification.is_read) {
      if (notification.id < 0) {
        // Local notification
        this.notificationService.markLocalAsRead(notification.id);
        this.loadRecentNotifications();
      } else {
        // Backend notification
        this.notificationService.markAsRead(notification.id).subscribe({
          next: () => {
            notification.is_read = true;
            this.loadRecentNotifications();
          }
        });
      }
    }
  }

  timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  navigateToNotification(notification: Notification) {
    this.markAsRead(notification, new Event('click'));
    this.closeDropdown();
    // Navigation handled by routerLink in template
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showDropdown && !this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
