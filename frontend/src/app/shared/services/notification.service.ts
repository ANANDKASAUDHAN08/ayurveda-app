import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  category: string;
  title: string;
  message: string;
  related_id?: number;
  related_type?: string;
  action_url?: string;
  priority: string;
  is_read: boolean;
  broadcast: boolean;
  created_at: string;
  read_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private pollingSubscription?: Subscription;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Listen for auth state changes
    this.authService.authStatus$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.unreadCountSubject.next(0);
      }
    });
  }

  getNotifications(params: {
    limit?: number;
    offset?: number;
    category?: string;
    unreadOnly?: boolean;
    type?: string;
  } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.unreadOnly) httpParams = httpParams.set('unreadOnly', params.unreadOnly.toString());
    if (params.type) httpParams = httpParams.set('type', params.type);

    return this.http.get(this.apiUrl, { params: httpParams });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => this.unreadCountSubject.next(response.count))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  refreshUnreadCount(): void {
    if (this.authService.isLoggedIn()) {
      this.getUnreadCount().subscribe({
        error: (err) => {
          if (err.status === 401) {
            this.unreadCountSubject.next(0);
          }
        }
      });
    }
  }

  startPolling(): void {
    if (this.pollingSubscription) return; // Already polling

    // Refresh unread count every 30 seconds
    this.pollingSubscription = interval(30000).subscribe(() => this.refreshUnreadCount());
    // Initial load
    this.refreshUnreadCount();
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      // Prescription
      'prescription_verified': 'fa-check-circle',
      'prescription_rejected': 'fa-times-circle',
      'prescription_expiring': 'fa-clock',
      'prescription_expired': 'fa-exclamation-triangle',
      'new_prescription_uploaded': 'fa-file-medical',

      // Refill
      'refill_approved': 'fa-check-circle',
      'refill_rejected': 'fa-times-circle',
      'refill_requested': 'fa-pills',
      'refill_reminder': 'fa-bell',

      // Appointment
      'appointment_booked': 'fa-calendar-check',
      'appointment_confirmed': 'fa-calendar-plus',
      'appointment_cancelled': 'fa-calendar-times',
      'appointment_rescheduled': 'fa-calendar',
      'appointment_reminder': 'fa-clock',
      'new_appointment_request': 'fa-calendar-alt',

      // Profile
      'profile_verified': 'fa-user-check',
      'profile_rejected': 'fa-user-times',
      'profile_update_required': 'fa-user-edit',
      'doctor_verification_approved': 'fa-user-md',
      'doctor_verification_rejected': 'fa-user-times',

      // Health
      'medication_reminder': 'fa-pills',
      'checkup_reminder': 'fa-heartbeat',
      'follow_up_reminder': 'fa-stethoscope',

      // Messaging
      'new_message': 'fa-envelope',
      'message_reply': 'fa-reply',

      // Payment
      'payment_success': 'fa-check-circle',
      'payment_failed': 'fa-times-circle',
      'invoice_generated': 'fa-file-invoice',
      'payment_reminder': 'fa-money-bill',

      // Emergency
      'emergency_alert': 'fa-exclamation-triangle',
      'critical_update': 'fa-exclamation-circle',

      // System
      'system_maintenance': 'fa-tools',
      'new_feature': 'fa-star',
      'security_alert': 'fa-shield-alt',
      'account_update': 'fa-user-cog',

      // Default
      'default': 'fa-bell'
    };

    return iconMap[type] || iconMap['default'];
  }

  getNotificationColor(type: string): string {
    if (type.includes('rejected') || type.includes('failed') || type.includes('expired')) {
      return 'text-red-600';
    } else if (type.includes('verified') || type.includes('approved') || type.includes('success')) {
      return 'text-green-600';
    } else if (type.includes('reminder') || type.includes('expiring')) {
      return 'text-yellow-600';
    } else if (type.includes('emergency') || type.includes('critical') || type.includes('alert')) {
      return 'text-red-700';
    }
    return 'text-blue-600';
  }
}
