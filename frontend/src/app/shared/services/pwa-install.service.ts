import { Injectable, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PwaInstallService {
    private deferredPrompt: any;
    private showInstallButtonSource = new BehaviorSubject<boolean>(false);
    showInstallButton$ = this.showInstallButtonSource.asObservable();

    constructor() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Let the browser show its own install banner if it wants
            // e.preventDefault();
            // Stash the event so it can be triggered later.
            this.deferredPrompt = e;
            // Update UI notify binary value of show install banner
            this.showInstallButtonSource.next(true);
        });

        window.addEventListener('appinstalled', (evt) => {
            // Log install to analytics
            console.log('INSTALL: Success');
            this.showInstallButtonSource.next(false);
        });
    }

    async installApp() {
        if (!this.deferredPrompt) {
            return;
        }
        // Show the install prompt
        this.deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        // Optionally, send analytics event with outcome of user choice
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        this.deferredPrompt = null;
        this.showInstallButtonSource.next(false);
    }
}
