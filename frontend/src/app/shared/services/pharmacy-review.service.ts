import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    PharmacyReview,
    ReviewStats,
    ReviewResponse
} from '../models/review.model';

@Injectable({
    providedIn: 'root'
})
export class PharmacyReviewService {
    private apiUrl = `${environment.apiUrl}/pharmacy-reviews`;

    constructor(private http: HttpClient) { }

    submitPharmacyReview(reviewData: {
        pharmacy_id: number;
        rating: number;
        title?: string;
        comment: string;
    }): Observable<ReviewResponse<PharmacyReview>> {
        return this.http.post<ReviewResponse<PharmacyReview>>(this.apiUrl, reviewData);
    }

    getPharmacyReviews(
        pharmacyId: number,
        page: number = 1,
        limit: number = 10
    ): Observable<ReviewResponse<PharmacyReview[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<ReviewResponse<PharmacyReview[]>>(
            `${this.apiUrl}/${pharmacyId}`,
            { params }
        );
    }

    getPharmacyReviewStats(
        pharmacyId: number
    ): Observable<ReviewResponse<ReviewStats>> {
        return this.http.get<ReviewResponse<ReviewStats>>(
            `${this.apiUrl}/stats/${pharmacyId}`
        );
    }

    updatePharmacyReview(
        reviewId: number,
        updateData: {
            rating?: number;
            title?: string;
            comment?: string;
        }
    ): Observable<ReviewResponse<PharmacyReview>> {
        return this.http.put<ReviewResponse<PharmacyReview>>(
            `${this.apiUrl}/${reviewId}`,
            updateData
        );
    }

    deletePharmacyReview(reviewId: number): Observable<ReviewResponse<null>> {
        return this.http.delete<ReviewResponse<null>>(`${this.apiUrl}/${reviewId}`);
    }
}
