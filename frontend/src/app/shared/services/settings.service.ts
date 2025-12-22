import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserSettings {
    settings: {
        theme: 'light' | 'dark' | 'system';
        fontSize: number;
        compactMode: boolean;
        reduceMotion: boolean;
    };
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        promotions: boolean;
        quietStart: string;
        quietEnd: string;
    };
    language: {
        selected: string;
        dateFormat: string;
        timeFormat: string;
        timezone: string;
        currency: string;
    };
    preferences: {
        autoRefresh: boolean;
        rememberSearch: boolean;
        searchRadius: number;
        shareData: boolean;
        locationTracking: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private apiUrl = `${environment.apiUrl}/settings`;

    constructor(private http: HttpClient) { }

    getUserSettings(): Observable<UserSettings> {
        return this.http.get<UserSettings>(this.apiUrl);
    }

    updateUserSettings(settings: UserSettings): Observable<any> {
        return this.http.put(this.apiUrl, settings);
    }
}
