import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { SnackbarService } from '../shared/services/snackbar.service';

@Injectable({
    providedIn: 'root'
})
export class StrictLogoutGuard implements CanActivate {

    constructor(private authService: AuthService, private snackbar: SnackbarService) { }

    canActivate(): boolean {
        // Only target Admins for auto-logout
        if (this.authService.isLoggedIn() && this.authService.getRole() === 'admin') {
            this.authService.logout();
            this.snackbar.show('Admin session ended. You are now browsing as a guest.', 'info');
        }
        return true;
    }
}
