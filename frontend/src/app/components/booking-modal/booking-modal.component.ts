import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, TimeSlot } from '../../shared/services/appointment.service';
import { PaymentService } from '../../shared/services/payment.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { DoctorService } from '../../shared/services/doctor.service';

interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  hasSlots?: boolean;
}

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-modal.component.html'
})
export class BookingModalComponent implements OnInit, OnChanges {
  @Input() doctor: any;
  @Input() isOpen = false;
  @Input() isInline = false;
  @Input() isInstant = false;  // NEW: Instant consultation mode
  @Input() isFree = false;     // NEW: Free consultation flag
  @Output() close = new EventEmitter<void>();
  @Output() bookingConfirmed = new EventEmitter<any>();

  // Booking data
  selectedDate: string = '';
  availableSlots: any[] = [];
  selectedSlot: any | null = null;

  // Patient info
  patientAge: number | null = null;
  patientGender: 'male' | 'female' | 'other' = 'male';
  consultationReason: string = '';

  // Legacy
  notes: string = '';

  // State
  loading = false;
  error: string = '';
  step: 'calendar' | 'time' | 'patient-info' | 'payment' | 'confirm' = 'calendar';

  // Calendar properties
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Payment
  paymentInProgress = false;
  razorpayLoaded = false;

  genders: ('male' | 'female' | 'other')[] = ['male', 'female', 'other'];

  constructor(
    private appointmentService: AppointmentService,
    private paymentService: PaymentService,
    private snackbar: SnackbarService,
    private doctorService: DoctorService
  ) { }

  ngOnInit() {
    this.initializeBookingFlow();
    this.loadRazorpay();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.initializeBookingFlow();
    }
  }

  initializeBookingFlow() {
    if (this.isInstant) {
      // Instant mode: Skip calendar, go straight to patient info
      this.step = 'patient-info';
      this.selectedDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } else {
      // Scheduled mode: Show calendar
      this.step = 'calendar';
      this.generateCalendar();
    }
  }

  async loadRazorpay() {
    try {
      await this.paymentService.loadRazorpayScript();
      this.razorpayLoaded = true;
    } catch (error) {
      console.error('Failed to load Razorpay:', error);
      this.razorpayLoaded = false;
    }
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    this.calendarDays = [];
    // Use IST for "today" calculation to prevent date shift
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    today.setHours(0, 0, 0, 0);

    let current = new Date(startDate);
    while (current <= endDate) {
      // Use en-CA locale to get YYYY-MM-DD in local time, preventing UTC shift
      const dateString = current.toLocaleDateString('en-CA');
      const isPast = current < today;

      this.calendarDays.push({
        date: new Date(current),
        dateString,
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        isPast,
        hasSlots: false
      });

      current.setDate(current.getDate() + 1);
    }

    // Load slots for calendar indicators
    if (this.doctor?.id) {
      const startStr = startDate.toLocaleDateString('en-CA');
      const endStr = endDate.toLocaleDateString('en-CA');

      this.doctorService.getAvailableSlots(this.doctor.id, startStr).subscribe({
        next: (slots) => {
          const availableDates = new Set(
            slots.map((s: any) => s.slot_date?.split('T')[0] || s.date)
          );

          this.calendarDays.forEach(day => {
            if (availableDates.has(day.dateString)) {
              day.hasSlots = true;
            }
          });
        },
        error: (err) => console.error('Error fetching slots:', err)
      });
    }
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(day: CalendarDay) {
    if (day.isPast || !day.isCurrentMonth) return;

    this.selectedDate = day.dateString;
    this.selectedSlot = null;
    this.error = '';
    this.loadAvailableSlots();
    this.step = 'time';
  }

  loadAvailableSlots() {
    if (!this.doctor?.id || !this.selectedDate) return;

    this.loading = true;
    this.error = '';

    this.doctorService.getAvailableSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        this.availableSlots = slots || [];
        this.loading = false;

        if (this.availableSlots.length === 0) {
          this.error = 'No available slots for this date. Please select another date.';
        }
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        this.error = 'Failed to load available slots. Please try again.';
        this.loading = false;
      }
    });
  }

  selectSlot(slot: any) {
    this.selectedSlot = slot;
    this.step = 'patient-info';
  }

  proceedFromPatientInfo() {
    // Validate patient info
    if (!this.patientAge || this.patientAge < 1 || this.patientAge > 120) {
      this.error = 'Please enter a valid age (1-120)';
      return;
    }

    if (!this.consultationReason.trim()) {
      this.error = 'Please provide a reason for consultation';
      return;
    }

    this.error = '';

    if (this.isFree) {
      // Free consultation - book directly
      this.confirmBooking();
    } else {
      // Paid consultation - proceed to payment
      this.initiatePayment();
    }
  }

  initiatePayment() {
    if (!this.doctor?.id) return;

    this.loading = true;
    this.paymentInProgress = true;

    const amount = this.doctor.consultationFee || this.doctor.consultation_fee || 0;

    this.appointmentService.createPaymentOrder(this.doctor.id, amount).subscribe({
      next: (orderData) => {
        this.loading = false;
        if (orderData.success && orderData.data) {
          this.openRazorpay(orderData.data);
        } else {
          this.error = 'Failed to create payment order';
          this.snackbar.error(this.error);
          this.paymentInProgress = false;
        }
      },
      error: (err) => {
        console.error('Error creating payment order:', err);
        this.error = 'Failed to initiate payment. Please try again.';
        this.snackbar.error(this.error);
        this.loading = false;
        this.paymentInProgress = false;
      }
    });
  }

  openRazorpay(orderData: any) {
    if (!this.razorpayLoaded) {
      this.error = 'Payment gateway not loaded. Please refresh and try again.';
      this.paymentInProgress = false;
      return;
    }

    const options = {
      key: this.paymentService.getKeyId(),
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'Video Consultation',
      description: `Consultation with ${this.doctor.name}`,
      order_id: orderData.order_id,
      handler: (response: any) => {
        this.handlePaymentSuccess(response, orderData);
      },
      modal: {
        ondismiss: () => {
          this.paymentInProgress = false;
          this.snackbar.warning('Payment cancelled');
        }
      },
      prefill: {
        name: '', // Can be filled from user profile
        email: '',
        contact: ''
      },
      theme: {
        color: '#00bfbf'
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  }

  handlePaymentSuccess(paymentResponse: any, orderData: any) {
    // Immediately show loading feedback to user
    this.loading = true;
    this.step = 'confirm'; // Show processing state
    this.snackbar.info('Processing your booking...');


    // Book appointment with payment details
    const bookingData = {
      doctor_id: this.doctor.id,
      slot_id: this.selectedSlot?.id,
      appointment_date: this.selectedDate,
      start_time: this.selectedSlot?.start_time || new Date().toTimeString().split(' ')[0],
      end_time: this.selectedSlot?.end_time || new Date(Date.now() + 30 * 60000).toTimeString().split(' ')[0], // fallback 30 mins
      consultation_type: 'video', // Backend specifically checks for video sessions
      patient_age: this.patientAge,
      patient_gender: this.patientGender,
      reason: this.consultationReason,
      payment_id: paymentResponse.razorpay_payment_id,
      order_id: paymentResponse.razorpay_order_id,
      amount: this.doctor.consultationFee || this.doctor.consultation_fee || 0
    };

    this.appointmentService.bookVideoConsultation(bookingData).subscribe({
      next: (response) => {
        this.loading = false;
        this.paymentInProgress = false;
        this.snackbar.success('Appointment booked successfully!');
        this.bookingConfirmed.emit(response);
        this.onClose();
      },
      error: (err) => {
        console.error('Error booking appointment:', err);
        this.error = err.error?.message || 'Failed to book appointment. Please contact support.';
        this.snackbar.error(this.error);
        this.loading = false;
        this.paymentInProgress = false;
      }
    });
  }

  confirmBooking() {
    this.loading = true;

    const bookingData = {
      doctor_id: this.doctor.id,
      slot_id: this.selectedSlot?.id,
      appointment_date: this.selectedDate,
      start_time: this.selectedSlot?.start_time || new Date().toTimeString().split(' ')[0],
      end_time: this.selectedSlot?.end_time || new Date(Date.now() + 30 * 60000).toTimeString().split(' ')[0], // fallback 30 mins
      consultation_type: 'video',
      patient_age: this.patientAge,
      patient_gender: this.patientGender,
      reason: this.consultationReason,
      is_free: true
    };

    this.appointmentService.bookVideoConsultation(bookingData).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackbar.success('Free consultation booked successfully!');
        this.bookingConfirmed.emit(response);
        this.onClose();
      },
      error: (err) => {
        console.error('Error booking appointment:', err);
        this.error = err.error?.message || 'Failed to book appointment. Please try again.';
        this.snackbar.error(this.error);
        this.loading = false;
      }
    });
  }

  onClose() {
    this.isOpen = false;
    this.selectedDate = '';
    this.selectedSlot = null;
    this.availableSlots = [];
    this.patientAge = null;
    this.patientGender = 'male';
    this.consultationReason = '';
    this.notes = '';
    this.error = '';
    this.paymentInProgress = false;
    this.currentMonth = new Date();

    // Reset to initial step
    if (this.isInstant) {
      this.step = 'patient-info';
    } else {
      this.step = 'calendar';
      this.generateCalendar();
    }

    this.close.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  goBack() {
    if (this.step === 'time') {
      this.step = 'calendar';
      this.selectedSlot = null;
      this.availableSlots = [];
    } else if (this.step === 'patient-info') {
      if (this.isInstant) {
        // Can't go back from patient info in instant mode
        this.onClose();
      } else {
        this.step = 'time';
      }
    } else if (this.step === 'payment') {
      this.step = 'patient-info';
      this.paymentInProgress = false;
    }
  }

  get currentMonthYear(): string {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }

  get consultationFee(): number {
    return this.doctor?.consultationFee || this.doctor?.consultation_fee || 0;
  }

  isCurrentStep(s: number): boolean {
    const stepMap: Record<string, number> = {
      'calendar': 1,
      'time': 2,
      'patient-info': 3,
      'payment': 4,
      'confirm': 4
    };

    if (this.isInstant) {
      const instantStepMap: Record<string, number> = {
        'patient-info': 1,
        'payment': 2,
        'confirm': 2
      };
      return instantStepMap[this.step] === s;
    }

    return stepMap[this.step] === s;
  }
}
