import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NewsletterResponse {
    success: boolean;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class NewsletterService {
    private apiUrl = `${environment.apiUrl}/newsletter`;

    constructor(private http: HttpClient) { }

    /**
     * Subscribe to newsletter
     */
    subscribe(email: string): Observable<NewsletterResponse> {
        return this.http.post<NewsletterResponse>(`${this.apiUrl}/subscribe`, { email });
    }

    /**
     * Unsubscribe from newsletter
     */
    unsubscribe(token: string): Observable<NewsletterResponse> {
        return this.http.post<NewsletterResponse>(`${this.apiUrl}/unsubscribe/${token}`, {});
    }
}
