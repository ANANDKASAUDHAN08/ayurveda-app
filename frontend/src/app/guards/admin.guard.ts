import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {

    constructor(private router: Router, private authService: AuthService) { }

    canActivate(): boolean {
        const role = this.authService.getRole();

        if (role === 'admin') {
            return true;
        } else {
            // Not an admin: Auto-logout and redirect
            this.authService.logout();
            this.router.navigate(['/admin/login']);
            return false;
        }
    }
}
