import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = `${environment.apiUrl}/calendar`;

  constructor(private http: HttpClient) { }

  getEvents(start?: string, end?: string, lat?: number, lon?: number): Observable<any> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    if (lat) params = params.set('lat', lat.toString());
    if (lon) params = params.set('lon', lon.toString());

    return this.http.get(`${this.apiUrl}/events`, { params });
  }

  getSymptomHeatmap(start?: string, end?: string): Observable<any> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    return this.http.get(`${this.apiUrl}/heatmap`, { params });
  }

  createEvent(eventData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`, eventData);
  }

  updateEvent(id: number, eventData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${id}`, eventData);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`);
  }

  logActivity(activityData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/log-activity`, activityData);
  }
}
