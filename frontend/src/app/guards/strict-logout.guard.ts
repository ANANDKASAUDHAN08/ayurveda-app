import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { SnackbarService } from '../shared/services/snackbar.service';

@Injectable({
    providedIn: 'root'
})
export class StrictLogoutGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private snackbar: SnackbarService,
        private router: Router
    ) { }

    canActivate(): boolean {
        // If user is logged in (any role), redirect to home
        if (this.authService.isLoggedIn()) {
            const role = this.authService.getRole();

            // Auto-logout admins
            if (role === 'admin') {
                this.authService.logout();
                this.snackbar.show('Admin session ended. You are now browsing as a guest.', 'info');
                return true;
            }

            // Redirect regular users and doctors to home
            this.router.navigate(['/home']);
            this.snackbar.show('You are already logged in. Redirecting to home.', 'info');
            return false;
        }

        // Allow access for guest users
        return true;
    }
}
