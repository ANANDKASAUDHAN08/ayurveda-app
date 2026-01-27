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

  // Client-side notifications (e.g., app updates)
  private localNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  public localNotifications$ = this.localNotificationsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // Listen for auth state changes
    this.authService.authStatus$.subscribe(isLoggedIn => {
      if (isLoggedIn && this.authService.getToken()) {
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
    // Only fetch if user has valid token
    if (this.authService.isLoggedIn() && this.authService.getToken()) {
      // Merged unread count logic helper
      const getMergedCount = (backendCount: number) => {
        const localUnreadCount = this.localNotificationsSubject.value.filter(n => !n.is_read).length;
        return backendCount + localUnreadCount;
      };

      this.getUnreadCount().subscribe({
        next: (response) => {
          this.unreadCountSubject.next(getMergedCount(response.count));
        },
        error: (err) => {
          // If offline or error, we can only rely on local count
          const localUnreadCount = this.localNotificationsSubject.value.filter(n => !n.is_read).length;
          this.unreadCountSubject.next(localUnreadCount);

          if (err.status === 401) {
            this.unreadCountSubject.next(0);
          }
        }
      });
    }
  }

  addLocalNotification(notification: Partial<Notification>): void {
    const defaultNotification: Notification = {
      id: Math.floor(Math.random() * -1000000), // Negative IDs for local ones
      user_id: 0,
      type: 'system_update',
      category: 'update',
      title: 'New Update',
      message: 'A new version is available',
      priority: 'high',
      is_read: false,
      broadcast: false,
      created_at: new Date().toISOString()
    };

    const newNotification = { ...defaultNotification, ...notification } as Notification;

    // Check if a similar notification already exists (e.g., same type)
    const current = this.localNotificationsSubject.value;
    if (!current.some(n => n.type === newNotification.type)) {
      this.localNotificationsSubject.next([newNotification, ...current]);

      // Increment unread count immediately for instant UI feedback
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);

      this.refreshUnreadCount();
    }
  }

  getLocalNotifications(): Notification[] {
    return this.localNotificationsSubject.value;
  }

  markLocalAsRead(id: number): void {
    const current = this.localNotificationsSubject.value;
    const index = current.findIndex(n => n.id === id);
    if (index !== -1) {
      current[index].is_read = true;
      this.localNotificationsSubject.next([...current]);
      this.refreshUnreadCount();
    }
  }

  startPolling(): void {
    if (this.pollingSubscription) return; // Already polling

    // Only start if user has valid token
    if (!this.authService.getToken()) return;

    // Refresh unread count every 10 seconds for better responsiveness
    this.pollingSubscription = interval(10000).subscribe(() => this.refreshUnreadCount());
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
      // Security & Account
      'account_created': 'fa-user-plus',
      'password_changed': 'fa-key',
      'email_changed': 'fa-envelope-open',
      'two_factor_enabled': 'fa-shield-alt',
      'suspicious_login': 'fa-exclamation-triangle',

      // Orders & Payments
      'order_confirmed': 'fa-shopping-cart',
      'order_shipped': 'fa-shipping-fast',
      'order_delivered': 'fa-box-open',
      'order_cancelled': 'fa-ban',
      'payment_success': 'fa-check-circle',
      'payment_failed': 'fa-times-circle',
      'refund_processed': 'fa-undo',
      'invoice_generated': 'fa-file-invoice',
      'payment_reminder': 'fa-money-bill',

      // Appointments
      'appointment_booked': 'fa-calendar-check',
      'appointment_confirmed': 'fa-calendar-plus',
      'appointment_cancelled': 'fa-calendar-times',
      'appointment_rescheduled': 'fa-calendar',
      'appointment_reminder': 'fa-clock',
      'appointment_completed': 'fa-check-double',
      'new_appointment_request': 'fa-calendar-alt',

      // Prescriptions
      'prescription_uploaded': 'fa-file-medical',
      'prescription_verified': 'fa-check-circle',
      'prescription_rejected': 'fa-times-circle',
      'prescription_expiring': 'fa-clock',
      'prescription_expired': 'fa-exclamation-triangle',
      'refill_approved': 'fa-check-circle',
      'refill_rejected': 'fa-times-circle',
      'refill_requested': 'fa-pills',
      'refill_reminder': 'fa-bell',

      // Lab Tests & Reports
      'lab_test_scheduled': 'fa-flask',
      'sample_collection_reminder': 'fa-vial',
      'test_results_ready': 'fa-file-medical-alt',
      'report_uploaded': 'fa-file-upload',

      // Doctor-Specific
      'new_patient_request': 'fa-user-plus',
      'patient_cancelled': 'fa-user-times',
      'new_review_received': 'fa-star',
      'earnings_updated': 'fa-coins',
      'slot_filled': 'fa-calendar-check',

      // Cart & Shopping
      'cart_reminder': 'fa-shopping-basket',
      'price_drop': 'fa-arrow-down',
      'stock_alert': 'fa-boxes',
      'offer_alert': 'fa-tags',

      // Health Records
      'record_shared': 'fa-share-alt',
      'vaccination_reminder': 'fa-syringe',
      'health_goal_milestone': 'fa-trophy',

      // Emergency Services
      'emergency_contact_updated': 'fa-address-book',
      'sos_alert_sent': 'fa-exclamation-circle',
      'ambulance_dispatched': 'fa-ambulance',

      // Health Reminders
      'medication_reminder': 'fa-pills',
      'checkup_reminder': 'fa-heartbeat',
      'follow_up_required': 'fa-stethoscope',

      // Engagement
      'article_published': 'fa-newspaper',
      'doctor_available': 'fa-user-md',
      'health_tip': 'fa-lightbulb',

      // System
      'new_feature': 'fa-star',
      'system_maintenance': 'fa-tools',
      'security_alert': 'fa-shield-alt',
      'account_update': 'fa-user-cog',

      // Legacy/Profile
      'profile_verified': 'fa-user-check',
      'profile_rejected': 'fa-user-times',
      'profile_update_required': 'fa-user-edit',
      'doctor_verification_approved': 'fa-user-md',
      'doctor_verification_rejected': 'fa-user-times',

      // Messaging
      'new_message': 'fa-envelope',
      'message_reply': 'fa-reply',

      // Emergency/Critical
      'emergency_alert': 'fa-exclamation-triangle',
      'critical_update': 'fa-exclamation-circle',

      // Default
      'default': 'fa-bell'
    };

    return iconMap[type] || iconMap['default'];
  }

  getNotificationColor(type: string): string {
    // Emergency & Critical (Red)
    if (type.includes('emergency') || type.includes('critical') || type.includes('alert') ||
      type.includes('sos') || type.includes('ambulance') || type.includes('suspicious')) {
      return 'text-red-700';
    }

    // Failures & Rejections (Red)
    if (type.includes('rejected') || type.includes('failed') || type.includes('expired') ||
      type.includes('cancelled') && !type.includes('patient_cancelled')) {
      return 'text-red-600';
    }

    // Success & Approvals (Green)
    if (type.includes('verified') || type.includes('approved') || type.includes('success') ||
      type.includes('confirmed') || type.includes('completed') || type.includes('delivered') ||
      type.includes('milestone')) {
      return 'text-green-600';
    }

    // Warnings & Reminders (Amber/Yellow)
    if (type.includes('reminder') || type.includes('expiring') || type.includes('pending') ||
      type.includes('cart_reminder') || type.includes('sample_collection')) {
      return 'text-amber-600';
    }

    // Orders & Payments (Blue)
    if (type.includes('order_') || type.includes('shipped') || type.includes('refund')) {
      return 'text-blue-600';
    }

    // Lab Tests & Reports (Purple)
    if (type.includes('lab_') || type.includes('test_') || type.includes('report_') || type.includes('results')) {
      return 'text-purple-600';
    }

    // Doctor-Specific (Indigo)
    if (type.includes('patient_') || type.includes('earnings') || type.includes('slot_') || type.includes('review')) {
      return 'text-indigo-600';
    }

    // Shopping & Offers (Emerald)
    if (type.includes('price_drop') || type.includes('stock_alert') || type.includes('offer_')) {
      return 'text-emerald-600';
    }

    // Security & Account (Slate)
    if (type.includes('password_') || type.includes('email_') || type.includes('two_factor') ||
      type.includes('account_') || type.includes('security_')) {
      return 'text-slate-700';
    }

    // Engagement & Tips (Cyan)
    if (type.includes('article_') || type.includes('health_tip') || type.includes('doctor_available')) {
      return 'text-cyan-600';
    }

    // Default (Blue)
    return 'text-blue-600';
  }
}
