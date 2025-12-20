import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-otp-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './otp-input.component.html',
    styleUrls: ['./otp-input.component.css']
})
export class OtpInputComponent {
    @Output() otpComplete = new EventEmitter<string>();
    @Input() autoFocus = true;

    digits: string[] = ['', '', '', '', '', ''];

    ngAfterViewInit() {
        if (this.autoFocus) {
            const firstInput = document.querySelector('input') as HTMLInputElement;
            firstInput?.focus();
        }
    }

    onInput(event: any, index: number) {
        const value = event.target.value;

        // Only allow numbers
        if (!/^\d*$/.test(value)) {
            this.digits[index] = '';
            return;
        }

        // Move to next input if digit entered
        if (value && index < 5) {
            const nextInput = event.target.nextElementSibling as HTMLInputElement;
            nextInput?.focus();
        }

        // Check if OTP is complete
        this.checkComplete();
    }

    onKeyDown(event: KeyboardEvent, index: number) {
        // Handle backspace
        if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
            const prevInput = (event.target as HTMLElement).previousElementSibling as HTMLInputElement;
            prevInput?.focus();
        }
    }

    onPaste(event: ClipboardEvent) {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text');

        if (pastedData && /^\d{6}$/.test(pastedData)) {
            // Valid 6-digit OTP pasted
            this.digits = pastedData.split('');
            this.checkComplete();

            // Focus last input
            const inputs = document.querySelectorAll('input');
            (inputs[5] as HTMLInputElement)?.focus();
        }
    }

    checkComplete() {
        const otp = this.digits.join('');
        if (otp.length === 6) {
            this.otpComplete.emit(otp);
        }
    }

    clear() {
        this.digits = ['', '', '', '', '', ''];
        const firstInput = document.querySelector('input') as HTMLInputElement;
        firstInput?.focus();
    }

    getOTP(): string {
        return this.digits.join('');
    }
}
