import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AppointmentService } from '../../services/appointment.service';

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
    this.http.get<any[]>('http://localhost:3000/api/doctors').subscribe({
      next: (doctors) => {
        this.doctor = doctors.find(d => d.userId === this.user.id);
        this.loading = false; // Keep loading true until both complete? Or just handle gracefully.
      },
      error: (err) => {
        console.error('Failed to fetch doctor profile', err);
        this.loading = false;
      }
    });
  }

  fetchAppointments() {
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (data) => {
        console.log('✅ Fetched appointments:', data);
        this.appointments = data;
        console.log('📊 Appointments array:', this.appointments);
        this.calculateStats();
        console.log('📈 Stats calculated - Upcoming:', this.upcomingAppointmentsCount, 'Patients:', this.totalPatientsCount);
      },
      error: (err) => {
        console.error('❌ Failed to fetch appointments', err);
      }
    });
  }

  calculateStats() {
    const now = new Date();
    this.upcomingAppointmentsCount = this.appointments.filter(app => {
      // Assuming appointment_date is YYYY-MM-DD and start_time is HH:mm:ss
      const dateStr = new Date(app.slot_date || app.appointment_date).toISOString().split('T')[0];
      const appDate = new Date(`${dateStr}T${app.start_time}`);
      return appDate >= now && app.status !== 'cancelled';
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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return this.appointments.filter(app => {
      const dateStr = new Date(app.slot_date || app.appointment_date).toISOString().split('T')[0];
      const appDate = new Date(dateStr);
      // Show appointments from today onwards (ignoring time for the date check)
      return appDate >= today && app.status !== 'cancelled';
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
}
