import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
    adminName: string = 'Admin';
    sidebarCollapsed: boolean = false;

    constructor(private router: Router) { }

    ngOnInit() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            this.adminName = user.name || 'Admin';
        }

        // Check if sidebar state is saved in localStorage
        const savedState = localStorage.getItem('adminSidebarCollapsed');
        if (savedState !== null) {
            this.sidebarCollapsed = savedState === 'true';
        }
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        localStorage.setItem('adminSidebarCollapsed', this.sidebarCollapsed.toString());
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('adminSidebarCollapsed');
        this.router.navigate(['/admin/login']);
    }
}
