import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordRequirements {
    minLength: boolean;
    maxLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
}

@Component({
    selector: 'app-password-strength-indicator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './password-strength-indicator.component.html',
    styleUrl: './password-strength-indicator.component.css'
})
export class PasswordStrengthIndicatorComponent implements OnChanges, OnDestroy {
    @Input() password: string = '';
    @Input() isFocused: boolean = false; // NEW: Track if input is focused
    @Input() mode: 'detailed' | 'compact' = 'detailed'; // NEW: Display mode
    @Output() validityChange = new EventEmitter<boolean>();

    isVisible: boolean = false; // NEW: Control visibility
    private hideTimer: any; // NEW: Auto-hide timer

    requirements: PasswordRequirements = {
        minLength: false,
        maxLength: true,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
    };

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['password']) {
            this.validatePassword();
            this.handleVisibility();
        }

        if (changes['isFocused']) {
            this.handleVisibility();
        }
    }

    private handleVisibility(): void {
        // Clear any existing timer
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }

        // Show if focused and has password
        if (this.isFocused && this.password && this.password.length > 0) {
            this.isVisible = true;

            // Auto-hide after 2 seconds of no typing
            this.hideTimer = setTimeout(() => {
                if (!this.isFocused) {
                    this.isVisible = false;
                }
            }, 2000);
        } else if (!this.isFocused) {
            // Hide immediately when focus lost
            this.isVisible = false;
        }
    }

    ngOnDestroy(): void {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
        }
    }

    private validatePassword(): void {
        const pwd = this.password || '';

        this.requirements = {
            minLength: pwd.length >= 8,
            maxLength: pwd.length <= 50,
            hasUppercase: /[A-Z]/.test(pwd),
            hasLowercase: /[a-z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
        };

        // Emit validity status
        const isValid = Object.values(this.requirements).every(req => req === true);
        this.validityChange.emit(isValid);
    }

    // Get overall strength percentage for progress bar
    getStrengthPercentage(): number {
        const requirements = Object.values(this.requirements);
        const metCount = requirements.filter(req => req === true).length;
        return (metCount / requirements.length) * 100;
    }

    // Get strength label
    getStrengthLabel(): string {
        const percentage = this.getStrengthPercentage();
        if (percentage === 0) return '';
        if (percentage < 40) return 'Weak';
        if (percentage < 70) return 'Fair';
        if (percentage < 100) return 'Good';
        return 'Strong';
    }

    // Get strength color
    getStrengthColor(): string {
        const percentage = this.getStrengthPercentage();
        if (percentage === 0) return 'bg-gray-300';
        if (percentage < 40) return 'bg-red-500';
        if (percentage < 70) return 'bg-yellow-500';
        if (percentage < 100) return 'bg-blue-500';
        return 'bg-emerald-500';
    }
}
