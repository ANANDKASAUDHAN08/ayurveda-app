import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../shared/services/appointment.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AuthService } from '../../shared/services/auth.service';
import { UserServiceCardComponent } from '../user-service-card/user-service-card.component';
import { ServiceCard } from '../../models/service-card.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UserServiceCardComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  // Existing appointment data
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  loading = true;
  filter: 'all' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled' = 'all';

  // New: Quick Stats
  userName: string = 'User';
  nextAppointment: any | null = null;
  ordersCount: number = 0;

  // New: Service Cards
  serviceCards: ServiceCard[] = [];
  careServices: ServiceCard[] = [];
  shopServices: ServiceCard[] = [];
  emergencyServices: ServiceCard[] = [];
  otherServices: ServiceCard[] = [];

  // Modal state
  showAppointmentsModal = false;

  constructor(
    private appointmentService: AppointmentService,
    private snackbar: SnackbarService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadUserName();
    this.loadAppointments();
    this.initializeServiceCards();
  }

  loadUserName() {
    const user = this.authService.getUser();
    if (user && user.name) {
      this.userName = user.name;
    }
  }

  initializeServiceCards() {
    this.serviceCards = [
      // CARE Category
      { id: 'appointments', title: 'Appointments', icon: 'fas fa-calendar-check', description: 'Book and manage your medical appointments', route: '/user/dashboard', category: 'care', color: 'emerald' },
      { id: 'find-doctors', title: 'Find Doctors', icon: 'fas fa-user-md', description: 'Search and connect with doctors', route: '/find-doctors', category: 'care', color: 'blue' },
      { id: 'hospitals', title: 'Hospitals', icon: 'fas fa-hospital', description: 'Find hospitals near you', route: '/hospitals', category: 'care', color: 'red' },
      { id: 'pharmacies', title: 'Pharmacies', icon: 'fa-solid fa-store', description: 'Locate pharmacies nearby', route: '/pharmacies', category: 'care', color: 'green' },

      // SHOP Category
      { id: 'prescriptions', title: 'My Prescriptions', icon: 'fa-solid fa-file-prescription', description: 'Manage prescriptions and refills', route: '/user/prescriptions', category: 'shop', color: 'purple' },
      { id: 'orders', title: 'My Orders', icon: 'fas fa-shopping-bag', description: 'Track your orders and purchases', route: '/orders', category: 'shop', badge: this.ordersCount, color: 'orange' },
      { id: 'medicines', title: 'Medicines', icon: 'fa-solid fa-pills', description: 'Buy medicines online', route: '/medicines', category: 'shop', color: 'teal' },
      { id: 'medical-devices', title: 'Medical Devices', icon: 'fas fa-heartbeat', description: 'Browse medical devices and equipment', route: '/medical-devices', category: 'shop', color: 'pink' },
      { id: 'lab-tests', title: 'Lab Tests', icon: 'fa-solid fa-flask', description: 'Book lab tests and health checkups', route: '/lab-tests', category: 'shop', color: 'indigo' },

      // EMERGENCY Category
      { id: 'emergency-hub', title: 'Emergency Hub', icon: 'fas fa-ambulance', description: 'Access emergency services quickly', route: '/emergency', category: 'emergency', color: 'red' },
      { id: 'nearby-hospitals', title: 'Nearby Hospitals', icon: 'fas fa-hospital-alt', description: 'Find emergency hospitals nearby', route: '/nearby-hospitals', category: 'emergency', color: 'red' },
      { id: 'first-aid', title: 'First Aid Guide', icon: 'fas fa-first-aid', description: 'Learn first aid procedures', route: '/first-aid', category: 'emergency', color: 'red' },

      // OTHER Category
      { id: 'profile', title: 'My Profile', icon: 'fas fa-user-circle', description: 'Manage your profile and preferences', route: '/user/profile', category: 'other', color: 'purple' },
      { id: 'settings', title: 'Settings', icon: 'fas fa-cog', description: 'Manage your account settings', route: '/user/settings', category: 'other', color: 'slate' }
    ];

    // Organize by category
    this.careServices = this.serviceCards.filter(c => c.category === 'care');
    this.shopServices = this.serviceCards.filter(c => c.category === 'shop');
    this.emergencyServices = this.serviceCards.filter(c => c.category === 'emergency');
    this.otherServices = this.serviceCards.filter(c => c.category === 'other');
  }

  // Modal methods
  openAppointmentsModal() {
    this.showAppointmentsModal = true;
  }

  closeAppointmentsModal() {
    this.showAppointmentsModal = false;
  }

  loadAppointments() {
    this.loading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        const now = new Date();
        this.appointments = data.map(app => {
          try {
            const dateStr = new Date(app.appointment_date).toISOString().split('T')[0];
            const appDate = new Date(`${dateStr}T${app.start_time}`);

            // If appointment is in the past (hoursDiff < 0) and is currently confirmed, mark as cancelled
            if (appDate < now && app.status === 'confirmed') {
              return { ...app, status: 'cancelled' };
            }
          } catch (e) {
            console.warn('Error processing appointment date:', e);
          }
          return app;
        });

        // Set next appointment for quick stats
        const upcomingAppointments = this.appointments
          .filter(app => {
            try {
              const dateStr = new Date(app.appointment_date).toISOString().split('T')[0];
              const appDate = new Date(`${dateStr}T${app.start_time}`);
              return appDate >= now && app.status === 'confirmed';
            } catch (e) {
              return false;
            }
          })
          .sort((a, b) => {
            const dateA = new Date(`${new Date(a.appointment_date).toISOString().split('T')[0]}T${a.start_time}`);
            const dateB = new Date(`${new Date(b.appointment_date).toISOString().split('T')[0]}T${b.start_time}`);
            return dateA.getTime() - dateB.getTime();
          });

        this.nextAppointment = upcomingAppointments[0] || null;

        this.applyFilter();
        setTimeout(() => {
          this.loading = false;
        }, 500);
      },
      error: (err) => {
        console.error('Error loading appointments', err);
        this.snackbar.error('Failed to load appointments');
        setTimeout(() => {
          this.loading = false;
        }, 500);
      }
    });
  }

  setFilter(filter: 'all' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled') {
    this.filter = filter;
    this.loading = true;

    // Add a small delay to show the loading state
    setTimeout(() => {
      this.applyFilter();
      this.loading = false;
    }, 500);
  }

  applyFilter() {
    const now = new Date();

    this.filteredAppointments = this.appointments.filter(app => {
      try {
        const dateStr = new Date(app.appointment_date).toISOString().split('T')[0];
        const appDate = new Date(`${dateStr}T${app.start_time}`);

        if (this.filter === 'all') return true;

        if (this.filter === 'cancelled') {
          return app.status === 'cancelled';
        }

        if (this.filter === 'confirmed') {
          return app.status === 'confirmed';
        }

        // For upcoming and completed, define behavior
        // If we want to hide cancelled appointments from 'upcoming' and 'completed':
        if (app.status === 'cancelled') return false;

        if (this.filter === 'upcoming') {
          return appDate >= now;
        }
        if (this.filter === 'completed') {
          return appDate < now;
        }
        return true;
      } catch (e) {
        return false;
      }
    });
  }

  cancel(id: number) {
    const appointment = this.appointments.find(a => a.id === id);
    if (!appointment) return;

    const dateStr = new Date(appointment.appointment_date).toISOString().split('T')[0];
    const appDate = new Date(`${dateStr}T${appointment.start_time}`);
    const now = new Date();
    const hoursDiff = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      this.snackbar.warning('Cannot cancel appointments less than 24 hours in advance.');
      return;
    }

    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        this.snackbar.success('Appointment cancelled successfully');
        this.loadAppointments(); // Reload to update list
      },
      error: (err) => {
        console.error('Error cancelling appointment', err);
        this.snackbar.error('Failed to cancel appointment');
      }
    });
  }
}
