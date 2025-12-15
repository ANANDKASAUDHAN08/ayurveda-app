import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Backward compatibility alias
export type SnackbarMessage = SnackbarData;

export interface SnackbarData {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SnackbarService {
    private snackbarSubject = new BehaviorSubject<SnackbarData | null>(null);
    public snackbar$ = this.snackbarSubject.asObservable();

    constructor() { }

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration: number = 3000) {
        this.snackbarSubject.next({ message, type, duration });
    }

    success(message: string, duration: number = 3000) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration: number = 3000) {
        this.show(message, 'error', duration);
    }

    info(message: string, duration: number = 3000) {
        this.show(message, 'info', duration);
    }

    warning(message: string, duration: number = 3000) {
        this.show(message, 'warning', duration);
    }

    hide() {
        this.snackbarSubject.next(null);
    }
}
