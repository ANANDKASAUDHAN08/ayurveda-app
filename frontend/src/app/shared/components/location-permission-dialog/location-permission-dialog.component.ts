import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';

@Component({
    selector: 'app-location-permission-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './location-permission-dialog.component.html',
    styleUrls: ['./location-permission-dialog.component.css']
})
export class LocationPermissionDialogComponent implements OnInit {
    private permissionService = inject(PermissionService);

    isOpen = false;
    instructions: string[] = [];
    shortInstruction = '';
    isMobile = false;

    ngOnInit() {
        this.isMobile = window.innerWidth < 768;
        this.instructions = this.permissionService.getEnableInstructions();
        this.shortInstruction = this.permissionService.getShortInstruction();
    }

    open() {
        this.isOpen = true;
        this.instructions = this.permissionService.getEnableInstructions();
        this.shortInstruction = this.permissionService.getShortInstruction();
    }

    close() {
        this.isOpen = false;
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
