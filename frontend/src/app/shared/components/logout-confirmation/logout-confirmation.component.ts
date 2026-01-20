import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-logout-confirmation',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './logout-confirmation.component.html',
    styleUrls: ['./logout-confirmation.component.css']
})
export class LogoutConfirmationComponent {
    @Input() isOpen = false;
    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    onConfirm() {
        this.confirm.emit();
    }

    onCancel() {
        this.cancel.emit();
    }

    // Close on backdrop click
    onBackdropClick() {
        this.onCancel();
    }
}
