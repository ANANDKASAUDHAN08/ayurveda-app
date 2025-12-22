import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  loading = false;

  // Filters
  filters = {
    category: 'all',
    unreadOnly: false,
    limit: 20,
    offset: 0
  };

  totalCount = 0;
  unreadCount = 0;

  categories = [
    { value: 'all', label: 'All' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'refill', label: 'Refills' },
    { value: 'appointment', label: 'Appointments' },
    { value: 'profile', label: 'Profile' },
    { value: 'health', label: 'Health' },
    { value: 'payment', label: 'Payments' },
    { value: 'system', label: 'System' }
  ];

  constructor(public notificationService: NotificationService) { }

  ngOnInit() {
    this.loadNotifications();
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.getNotifications(this.filters).subscribe({
      next: (response) => {
        this.notifications = response.notifications;
        this.totalCount = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.filters.offset = 0;
    this.loadNotifications();
  }

  markAsRead(notification: Notification) {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.is_read = true;
        }
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
      }
    });
  }

  deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(notification.id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
        }
      });
    }
  }

  timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  }

  loadMore() {
    this.filters.offset += this.filters.limit;
    this.loading = true;
    this.notificationService.getNotifications(this.filters).subscribe({
      next: (response) => {
        this.notifications = [...this.notifications, ...response.notifications];
        this.totalCount = response.total;
        this.loading = false;
      }
    });
  }
}
