import { environment } from '@env/environment';

import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OtpInputComponent } from '../../shared/components/otp-input/otp-input.component';

@Component({
    selector: 'app-phone-verification-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, OtpInputComponent],
    templateUrl: './phone-verification-modal.component.html',
    styleUrls: []
})
export class PhoneVerificationModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() verified = new EventEmitter<string>();
    @ViewChild(OtpInputComponent) otpInput!: OtpInputComponent;

    isOpen = false;
    step: 'phone' | 'otp' = 'phone';

    phoneNumber = '';
    loading = false;
    error = '';

    // OTP state
    otpSent = false;
    otpCode = '';
    timeLeft = 300; // 5 minutes in seconds
    canResend = false;
    resendCooldown = 60;
    private timerInterval: any;
    private resendInterval: any;

    userId: number | null = null;
    userName = '';

    constructor(private http: HttpClient) { }

    open(userId: number, userName: string, existingPhone?: string) {
        this.isOpen = true;
        this.userId = userId;
        this.userName = userName;
        if (existingPhone) {
            this.phoneNumber = existingPhone;
        }
        this.reset();
    }

    closeModal() {
        this.isOpen = false;
        this.reset();
        this.close.emit();
    }

    reset() {
        this.step = 'phone';
        this.loading = false;
        this.error = '';
        this.otpSent = false;
        this.otpCode = '';
        this.timeLeft = 300;
        this.canResend = false;
        this.resendCooldown = 60;
        this.clearTimers();
    }

    sendOTP() {
        if (!this.phoneNumber || this.loading) return;

        this.loading = true;
        this.error = '';

        this.http.post<any>(environment.apiUrl + '/send-otp', {
            phone: this.phoneNumber,
            userId: this.userId,
            name: this.userName
        }).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.step = 'otp';
                    this.otpSent = true;
                    this.startTimer();
                    this.startResendCooldown();

                    // For development: auto-fill OTP
                    if (response.developmentOTP) {
                        console.log('🔐 Development OTP:', response.developmentOTP);
                    }
                } else if (response.alreadyVerified) {
                    this.error = 'Phone number already verified';
                    setTimeout(() => this.closeModal(), 2000);
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Failed to send OTP. Please try again.';
            }
        });
    }

    verifyOTP() {
        const otp = this.otpInput?.getOTP() || this.otpCode;

        if (!otp || otp.length !== 6 || this.loading) return;

        this.loading = true;
        this.error = '';

        this.http.post<any>(environment.apiUrl + '/verify-otp', {
            userId: this.userId,
            otp: otp
        }).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.success) {
                    this.verified.emit(this.phoneNumber);
                    this.closeModal();
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Invalid OTP code';
                this.otpInput?.clear();
            }
        });
    }

    resendOTP() {
        if (!this.canResend) return;

        this.canResend = false;
        this.resendCooldown = 60;
        this.sendOTP();
    }

    onOtpComplete(otp: string) {
        this.otpCode = otp;
        // Auto-verify when OTP is complete
        setTimeout(() => this.verifyOTP(), 300);
    }

    startTimer() {
        this.timeLeft = 300;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.clearTimers();
                this.error = 'OTP expired. Please request a new one.';
            }
        }, 1000);
    }

    startResendCooldown() {
        this.canResend = false;
        this.resendCooldown = 60;
        this.resendInterval = setInterval(() => {
            this.resendCooldown--;
            if (this.resendCooldown <= 0) {
                this.canResend = true;
                clearInterval(this.resendInterval);
            }
        }, 1000);
    }

    clearTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.resendInterval) {
            clearInterval(this.resendInterval);
        }
    }

    get formattedTime(): string {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    ngOnDestroy() {
        this.clearTimers();
    }
}
