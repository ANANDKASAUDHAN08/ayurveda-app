import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService, SnackbarData } from '../../services/snackbar.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-snackbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './snackbar.component.html',
    styles: []
})
export class SnackbarComponent implements OnInit, OnDestroy {
    show = false;
    message = '';
    type: 'success' | 'error' | 'info' | 'warning' = 'success';
    private subscription: Subscription | null = null;
    private timeoutId: any;

    constructor(private snackbarService: SnackbarService) { }

    ngOnInit() {
        this.subscription = this.snackbarService.snackbar$.subscribe((data: SnackbarData | null) => {
            if (data) {
                this.message = data.message;
                this.type = data.type;
                this.show = true;

                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }

                if (data.duration && data.duration > 0) {
                    this.timeoutId = setTimeout(() => {
                        this.show = false;
                    }, data.duration);
                }
            } else {
                this.show = false;
            }
        });
    }

    close() {
        this.show = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
