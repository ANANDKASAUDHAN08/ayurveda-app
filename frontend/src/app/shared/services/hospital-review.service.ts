import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    HospitalReview,
    ReviewStats,
    ReviewResponse,
    HospitalAspects
} from '../models/review.model';

@Injectable({
    providedIn: 'root'
})
export class HospitalReviewService {
    private apiUrl = `${environment.apiUrl}/hospital-reviews`;

    constructor(private http: HttpClient) { }

    submitHospitalReview(reviewData: {
        hospital_id: number;
        hospital_source: string;
        rating: number;
        title?: string;
        comment: string;
        aspects?: HospitalAspects;
    }): Observable<ReviewResponse<HospitalReview>> {
        return this.http.post<ReviewResponse<HospitalReview>>(this.apiUrl, reviewData);
    }

    getHospitalReviews(
        hospitalId: number,
        source: string,
        page: number = 1,
        limit: number = 10
    ): Observable<ReviewResponse<HospitalReview[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<ReviewResponse<HospitalReview[]>>(
            `${this.apiUrl}/${hospitalId}/${source}`,
            { params }
        );
    }

    getHospitalReviewStats(
        hospitalId: number,
        source: string
    ): Observable<ReviewResponse<ReviewStats>> {
        return this.http.get<ReviewResponse<ReviewStats>>(
            `${this.apiUrl}/stats/${hospitalId}/${source}`
        );
    }

    getUserHospitalReviews(
        userId: number,
        page: number = 1,
        limit: number = 10
    ): Observable<ReviewResponse<HospitalReview[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<ReviewResponse<HospitalReview[]>>(
            `${this.apiUrl}/user/${userId}`,
            { params }
        );
    }

    updateHospitalReview(
        reviewId: number,
        updateData: {
            rating?: number;
            title?: string;
            comment?: string;
            aspects?: HospitalAspects;
        }
    ): Observable<ReviewResponse<HospitalReview>> {
        return this.http.put<ReviewResponse<HospitalReview>>(
            `${this.apiUrl}/${reviewId}`,
            updateData
        );
    }

    deleteHospitalReview(reviewId: number): Observable<ReviewResponse<null>> {
        return this.http.delete<ReviewResponse<null>>(`${this.apiUrl}/${reviewId}`);
    }
}
