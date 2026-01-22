import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { LocationService } from '../../services/location.service';

@Component({
    selector: 'app-location-permission-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './location-permission-dialog.component.html',
    styleUrls: ['./location-permission-dialog.component.css']
})
export class LocationPermissionDialogComponent implements OnInit {
    private permissionService = inject(PermissionService);
    private locationService = inject(LocationService);

    isOpen = false;
    instructions: string[] = [];
    shortInstruction = '';
    isMobile = false;

    ngOnInit() {
        this.isOpen = true; // Open automatically when component is created via *ngIf
        this.isMobile = window.innerWidth < 768;
        this.instructions = this.permissionService.getEnableInstructions();
        this.shortInstruction = this.permissionService.getShortInstruction();
    }

    get canOpenSettings(): boolean {
        const userAgent = navigator.userAgent.toLowerCase();
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        // Only show for Chrome desktop in a tab, as other browsers or PWAs don't support the chrome:// protocol
        return /chrome/.test(userAgent) && !/edge/.test(userAgent) && !/mobile/.test(userAgent) && !isStandalone;
    }

    open() {
        this.isOpen = true;
        this.instructions = this.permissionService.getEnableInstructions();
        this.shortInstruction = this.permissionService.getShortInstruction();
    }

    close() {
        this.isOpen = false;
        // Notify service to remove from DOM after animation
        setTimeout(() => {
            this.locationService.hidePermissionDialog();
        }, 300);
    }

    openSettings() {
        this.permissionService.openSiteSettings();
        // Close after a delay to let user see the attempt
        setTimeout(() => {
            // Don't auto-close on mobile as settings can't be opened programmatically
            if (!this.isMobile) {
                this.close();
            }
        }, 500);
    }

    refreshPage() {
        window.location.reload();
    }
}
