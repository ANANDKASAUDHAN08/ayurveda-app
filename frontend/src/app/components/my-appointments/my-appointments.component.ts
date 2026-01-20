import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../shared/services/appointment.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
    selector: 'app-my-appointments',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-appointments.component.html',
    styleUrls: ['./my-appointments.component.css']
})
export class MyAppointmentsComponent implements OnInit {

    // Tab state
    activeTab: 'upcoming' | 'past' = 'upcoming';

    // Appointments data
    upcomingAppointments: any[] = [];
    pastAppointments: any[] = [];

    // Loading states
    loading = false;
    error = '';

    // Modals
    showCancelModal = false;
    showReviewModal = false;
    selectedAppointment: any = null;

    // Cancel form
    cancelReason = '';
    cancelling = false;

    // Review form
    reviewRating = 5;
    reviewText = '';
    submittingReview = false;

    // Pagination for Past Appointments
    currentPage = 1;
    pageSize = 6;

    constructor(
        private appointmentService: AppointmentService,
        private snackbar: SnackbarService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadAppointments();
    }

    loadAppointments() {
        this.loading = true;
        this.error = '';
        this.currentPage = 1; // Reset to first page on reload

        this.appointmentService.getMyVideoAppointments().subscribe({
            next: (response) => {
                const appointments = Array.isArray(response.data) ? response.data :
                    (Array.isArray(response) ? response : []);

                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

                const getAptDate = (apt: any) => {
                    if (!apt.appointment_date) return new Date(0);
                    const d = new Date(apt.appointment_date);
                    const dateStr = d.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
                    return new Date(dateStr + ' ' + (apt.start_time || '00:00'));
                };

                this.upcomingAppointments = appointments.filter((apt: any) => {
                    const aptDate = getAptDate(apt);

                    if (apt.consultation_type === 'video' && apt.status === 'confirmed') {
                        const d = new Date(apt.appointment_date);
                        const dateStr = d.toLocaleDateString('en-CA');
                        const endTime = new Date(dateStr + ' ' + (apt.end_time || '00:00'));
                        const thirtyMinsAfterStart = new Date(aptDate.getTime() + 30 * 60 * 1000);
                        return now < thirtyMinsAfterStart && apt.status !== 'cancelled' && apt.status !== 'completed';
                    }

                    return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
                }).sort((a: any, b: any) => getAptDate(a).getTime() - getAptDate(b).getTime());

                this.pastAppointments = appointments.filter((apt: any) => {
                    const aptDate = getAptDate(apt);

                    // For video consultations, move to past after 30 mins from start time
                    if (apt.consultation_type === 'video' && apt.status === 'confirmed') {
                        const thirtyMinsAfterStart = new Date(aptDate.getTime() + 30 * 60 * 1000);
                        return now >= thirtyMinsAfterStart || apt.status === 'cancelled' || apt.status === 'completed';
                    }

                    return aptDate < now || apt.status === 'cancelled' || apt.status === 'completed';
                }).sort((a: any, b: any) => getAptDate(b).getTime() - getAptDate(a).getTime());

                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading appointments:', err);
                this.error = 'Failed to load appointments. Please try again.';
                this.loading = false;
            }
        });
    }

    switchTab(tab: 'upcoming' | 'past') {
        this.activeTab = tab;
        if (tab === 'past') {
            this.currentPage = 1; // Reset pagination when switching to past tab
        }
    }

    joinVideoCall(appointment: any) {
        // Check if appointment is within joinable time window (e.g., 10 minutes before to 30 minutes after)
        const datePart = appointment.appointment_date.split('T')[0];
        const aptDateTime = new Date(datePart + ' ' + (appointment.start_time || '00:00'));
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const diffMinutes = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);

        if (diffMinutes > 10) {
            this.snackbar.warning('Call can be joined 10 minutes before scheduled time');
            return;
        }

        if (diffMinutes < -30) {
            this.snackbar.error('This appointment has expired');
            return;
        }

        // Navigate to video call component
        this.router.navigate(['/video-call', appointment.id]);
    }

    isJoinable(appointment: any): boolean {
        if (appointment.status !== 'confirmed') return false;
        if (!appointment.start_time) return false;

        const datePart = appointment.appointment_date.split('T')[0];
        const aptDateTime = new Date(datePart + ' ' + appointment.start_time);
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const diffMinutes = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);

        return diffMinutes <= 10 && diffMinutes >= -30;
    }

    openCancelModal(appointment: any) {
        this.selectedAppointment = appointment;
        this.cancelReason = '';
        this.showCancelModal = true;
    }

    closeCancelModal() {
        this.showCancelModal = false;
        this.selectedAppointment = null;
        this.cancelReason = '';
    }

    confirmCancellation() {
        if (!this.cancelReason.trim()) {
            this.snackbar.warning('Please provide a reason for cancellation');
            return;
        }

        if (!this.selectedAppointment) return;

        this.cancelling = true;

        this.appointmentService.cancelVideoAppointment(
            this.selectedAppointment.id,
            this.cancelReason
        ).subscribe({
            next: () => {
                this.snackbar.success('Appointment cancelled successfully');
                this.cancelling = false;
                this.closeCancelModal();
                this.loadAppointments(); // Reload
            },
            error: (err) => {
                console.error('Error cancelling appointment:', err);
                this.snackbar.error('Failed to cancel appointment. Please try again.');
                this.cancelling = false;
            }
        });
    }

    openReviewModal(appointment: any) {
        this.selectedAppointment = appointment;
        this.reviewRating = 5;
        this.reviewText = '';
        this.showReviewModal = true;
    }

    closeReviewModal() {
        this.showReviewModal = false;
        this.selectedAppointment = null;
        this.reviewRating = 5;
        this.reviewText = '';
    }

    submitReview() {
        if (!this.reviewText.trim()) {
            this.snackbar.warning('Please write a review');
            return;
        }

        if (!this.selectedAppointment) return;

        this.submittingReview = true;

        this.appointmentService.addReview(
            this.selectedAppointment.id,
            this.selectedAppointment.doctor_id,
            this.reviewRating,
            this.reviewText
        ).subscribe({
            next: () => {
                this.snackbar.success('Review submitted successfully. Thank you!');
                this.submittingReview = false;
                this.closeReviewModal();
                this.loadAppointments(); // Reload to update review status
            },
            error: (err) => {
                console.error('Error submitting review:', err);
                this.snackbar.error('Failed to submit review. Please try again.');
                this.submittingReview = false;
            }
        });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        });
    }

    formatTime(timeString: string): string {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'fa-check-circle';
            case 'completed':
                return 'fa-check-double';
            case 'cancelled':
                return 'fa-times-circle';
            default:
                return 'fa-clock';
        }
    }

    getStatusLabel(status: string): string {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    canCancel(appointment: any): boolean {
        if (appointment.status !== 'confirmed') return false;

        const datePart = appointment.appointment_date.split('T')[0];
        const aptDateTime = new Date(datePart + ' ' + (appointment.start_time || '00:00'));
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const diffHours = (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Can cancel if more than 1 hour away
        return diffHours > 1;
    }

    canReview(appointment: any): boolean {
        return appointment.status === 'completed' && !appointment.review_submitted;
    }

    // Pagination Helpers for Past Appointments
    get totalPages(): number {
        return Math.ceil(this.pastAppointments.length / this.pageSize);
    }

    get paginatedPastAppointments(): any[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.pastAppointments.slice(startIndex, startIndex + this.pageSize);
    }

    get pageNumbers(): number[] {
        const pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.scrollToTop();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.scrollToTop();
        }
    }

    goToPage(page: number) {
        this.currentPage = page;
        this.scrollToTop();
    }

    private scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
