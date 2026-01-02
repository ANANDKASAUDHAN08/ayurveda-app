import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GoogleMapsLoaderService {
    private isLoadedSubject = new BehaviorSubject<boolean>(false);
    public isLoaded$: Observable<boolean> = this.isLoadedSubject.asObservable();
    private isLoaded = false;

    load(): Promise<void> {
        if (this.isLoaded) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            if (typeof google !== 'undefined' && google.maps) {
                this.isLoaded = true;
                this.isLoadedSubject.next(true);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.isLoaded = true;
                this.isLoadedSubject.next(true);
                resolve();
            };

            script.onerror = (error) => {
                reject(error);
            };

            document.head.appendChild(script);
        });
    }
}
