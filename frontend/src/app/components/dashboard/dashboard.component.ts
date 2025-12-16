import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../shared/services/appointment.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  loading = true;
  filter: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all';

  constructor(
    private appointmentService: AppointmentService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadAppointments();
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

  setFilter(filter: 'all' | 'upcoming' | 'completed' | 'cancelled') {
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
