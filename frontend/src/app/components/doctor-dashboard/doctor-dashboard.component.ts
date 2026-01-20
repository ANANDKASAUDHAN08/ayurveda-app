import { environment } from '@env/environment';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AppointmentService } from '../../shared/services/appointment.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './doctor-dashboard.component.html'
})
export class DoctorDashboardComponent implements OnInit {
  user: any;
  doctor: any;
  loading = true;

  appointments: any[] = [];
  upcomingAppointmentsCount = 0;
  totalPatientsCount = 0;
  showAppointments = false;
  showPatients = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStr);

    if (this.user.role !== 'doctor') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.fetchDoctorProfile();
    this.fetchAppointments();
  }

  fetchDoctorProfile() {
    this.http.get<any[]>(environment.apiUrl + '/doctors').subscribe({
      next: (doctors) => {
        this.doctor = doctors.find(d => d.userId === this.user.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch doctor profile', err);
        this.loading = false;
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fetchAppointments() {
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.calculateStats();
      },
      error: (err) => {
        console.error('❌ Failed to fetch appointments', err);
      }
    });
  }

  calculateStats() {
    const todayStr = this.formatDate(new Date());

    this.upcomingAppointmentsCount = this.appointments.filter(app => {
      const appDateStr = this.formatDate(app.slot_date || app.appointment_date);
      // Include all appointments from today onwards
      return appDateStr >= todayStr && app.status !== 'cancelled';
    }).length;

    // Count unique patients
    const uniquePatientIds = new Set(this.appointments.map(app => app.user_id));
    this.totalPatientsCount = uniquePatientIds.size;
  }

  toggleAppointments() {
    this.showAppointments = !this.showAppointments;
    if (this.showAppointments) {
      this.showPatients = false;
    }
  }

  togglePatients() {
    this.showPatients = !this.showPatients;
    if (this.showPatients) {
      this.showAppointments = false;
    }
  }

  getUpcomingAppointments() {
    const todayStr = this.formatDate(new Date());

    return this.appointments.filter(app => {
      const appDateStr = this.formatDate(app.slot_date || app.appointment_date);
      // Show appointments from today onwards
      return appDateStr >= todayStr && app.status !== 'cancelled';
    });
  }

  getProfileScore(): number {
    if (!this.doctor) return 0;
    let score = 0;
    if (this.doctor.name) score += 12.5;
    if (this.doctor.specialization) score += 12.5;
    if (this.doctor.experience) score += 12.5;
    if (this.doctor.consultationFee) score += 12.5;
    if (this.doctor.about) score += 12.5;
    if (this.doctor.phone) score += 12.5;
    if (this.doctor.qualifications) score += 12.5;
    if (this.doctor.languages) score += 12.5;
    return score;
  }

  getUniquePatients() {
    const patientMap = new Map();
    this.appointments.forEach(app => {
      if (!patientMap.has(app.user_id)) {
        patientMap.set(app.user_id, {
          userId: app.user_id,
          userName: app.user_name || 'Unknown Patient',
          appointmentCount: 0
        });
      }
      patientMap.get(app.user_id).appointmentCount++;
    });
    return Array.from(patientMap.values());
  }

  isJoinable(appointment: any): boolean {
    if (appointment.status !== 'confirmed') return false;
    if (!appointment.start_time) return false;

    // Use IST time for comparison
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dateStr = this.formatDate(appointment.slot_date || appointment.appointment_date);
    const aptDateTime = new Date(`${dateStr}T${appointment.start_time}`);

    const diffMinutes = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);

    // Available 10 mins before and 30 mins after
    return diffMinutes <= 10 && diffMinutes >= -30;
  }

  joinVideoCall(appointment: any) {
    this.router.navigate(['/video-call', appointment.id]);
  }
}
