import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PermissionStatus {
    state: 'granted' | 'denied' | 'prompt';
    canRequest: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private locationPermissionSubject = new BehaviorSubject<PermissionStatus>({
        state: 'prompt',
        canRequest: true
    });
    public locationPermission$ = this.locationPermissionSubject.asObservable();

    constructor() {
        this.checkLocationPermission();
    }

    /**
     * Check the current location permission status
     */
    async checkLocationPermission(): Promise<PermissionStatus> {
        try {
            // Check if Permissions API is available
            if ('permissions' in navigator) {
                const result = await navigator.permissions.query({ name: 'geolocation' });

                const status: PermissionStatus = {
                    state: result.state as 'granted' | 'denied' | 'prompt',
                    canRequest: result.state !== 'denied'
                };

                this.locationPermissionSubject.next(status);

                // Listen for permission changes
                result.addEventListener('change', () => {
                    const updatedStatus: PermissionStatus = {
                        state: result.state as 'granted' | 'denied' | 'prompt',
                        canRequest: result.state !== 'denied'
                    };
                    this.locationPermissionSubject.next(updatedStatus);
                });

                return status;
            } else {
                // Fallback if Permissions API is not available
                // We'll try to infer status from localStorage
                const status = this.getStoredPermissionStatus();
                this.locationPermissionSubject.next(status);
                return status;
            }
        } catch (error) {
            console.error('Error checking location permission:', error);
            const status: PermissionStatus = { state: 'prompt', canRequest: true };
            this.locationPermissionSubject.next(status);
            return status;
        }
    }

    /**
     * Store permission denial in localStorage to track it
     */
    setPermissionDenied(): void {
        localStorage.setItem('locationPermissionDenied', 'true');
        this.locationPermissionSubject.next({
            state: 'denied',
            canRequest: false
        });
    }

    /**
     * Get stored permission status from localStorage
     */
    private getStoredPermissionStatus(): PermissionStatus {
        const isDenied = localStorage.getItem('locationPermissionDenied') === 'true';
        return {
            state: isDenied ? 'denied' : 'prompt',
            canRequest: !isDenied
        };
    }

    /**
     * Clear stored permission status (useful for testing)
     */
    clearPermissionStatus(): void {
        localStorage.removeItem('locationPermissionDenied');
        this.checkLocationPermission();
    }

    private isPWAActive(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    }

    /**
     * Get instructions for enabling location based on browser/platform
     */
    getEnableInstructions(): string[] {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
        const isFirefox = /firefox/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
        const isPWA = this.isPWAActive();

        if (isPWA) {
            if (isIOS) {
                return [
                    'Minimize this app and open the iPhone "Settings" app',
                    'Scroll down and find this app (Health Connect)',
                    'Tap on "Location"',
                    'Select "While Using the App"',
                    'Return to the app and it should work'
                ];
            } else if (isAndroid) {
                return [
                    'Minimize this app and open your phone "Settings"',
                    'Go to "Apps" or "Application Manager"',
                    'Find and tap on "Health Connect"',
                    'Tap "Permissions" then "Location"',
                    'Select "Allow only while using the app"',
                    'Reopen the app'
                ];
            }
        }

        if (isIOS && isSafari) {
            return [
                'Open the Settings app on your iPhone/iPad',
                'Scroll down and tap "Safari"',
                'Tap "Location" under Privacy & Security',
                'Select "Ask" or "Allow"',
                'Return to this app and refresh the page'
            ];
        } else if (isIOS) {
            // iOS Chrome/Firefox
            return [
                'Open the Settings app on your iPhone/iPad',
                'Scroll down and find your browser app (Chrome/Firefox)',
                'Tap "Location"',
                'Select "Ask" or "While Using the App"',
                'Return to this app and refresh the page'
            ];
        } else if (isAndroid && isChrome) {
            return [
                'Look at the top address bar',
                'Tap the lock icon (🔒) or "i" icon to the left of the URL',
                'Tap "Permissions" or "Site settings"',
                'Find "Location" and toggle it to "Allow"',
                'Refresh the page to see the changes'
            ];
        } else if (isAndroid) {
            return [
                'Tap the menu (⋮ or ≡) in your browser',
                'Go to "Settings" then "Site settings"',
                'Tap "Location"',
                'Find this website in the "Blocked" list',
                'Tap it and select "Allow"',
                'Return and refresh the page'
            ];
        } else if (isChrome) {
            // Desktop Chrome
            return [
                'Click the lock icon (🔒) to the left of the website address',
                'Toggle the "Location" switch to ON',
                'If you don\'t see the switch, click "Site settings"',
                'Find "Location" in the list and change it to "Allow"',
                'Come back to this page and click Refresh'
            ];
        } else if (isFirefox) {
            return [
                'Click the lock icon (🔒) in the address bar',
                'Click "Clear" next to "Blocked Temporarily" or "Permissions"',
                'Refresh the page and click "Allow" when prompted again'
            ];
        } else {
            // Generic fallback
            return [
                'Click the lock icon (🔒) or "i" icon in the address bar',
                'Look for "Permissions" or "Site settings"',
                'Change "Location" permission to "Allow"',
                'Refresh the page and try again'
            ];
        }
    }

    /**
     * Get short instruction for mobile bottom sheets
     */
    getShortInstruction(): string {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        if (isIOS) {
            return 'Open iPhone Settings → Safari → Location → Allow';
        } else if (isAndroid) {
            return 'Tap the lock icon (🔒) in address bar → Permissions → Location → Allow';
        } else {
            return 'Click the lock icon (🔒) in address bar → Allow Location';
        }
    }

    /**
     * Try to open site settings (not supported in all browsers)
     */
    openSiteSettings(): void {
        // This doesn't work in most mobile browsers, but we can try
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);

        if (isChrome) {
            // Try to open Chrome site settings
            try {
                window.open('chrome://settings/content/siteDetails?site=' + encodeURIComponent(window.location.origin));
            } catch (e) {
                console.log('Cannot programmatically open settings');
            }
        }
        // For other browsers, we can't programmatically open settings
        // User will need to follow manual instructions
    }
}
