import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LogoutConfirmationService {
    private showDialogSubject = new BehaviorSubject<boolean>(false);
    public showDialog$ = this.showDialogSubject.asObservable();

    private confirmCallback: (() => void) | null = null;

    /**
     * Request logout confirmation from user
     * @param onConfirm Callback to execute when user confirms logout
     */
    requestLogout(onConfirm: () => void): void {
        this.confirmCallback = onConfirm;
        this.showDialogSubject.next(true);
    }

    confirmLogout(): void {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.showDialogSubject.next(false);
    }

    cancelLogout(): void {
        this.confirmCallback = null;
        this.showDialogSubject.next(false);
    }
}
