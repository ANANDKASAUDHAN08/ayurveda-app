import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    WebsiteReview,
    WebsiteReviewStats,
    ReviewResponse
} from '../models/review.model';

@Injectable({
    providedIn: 'root'
})
export class WebsiteReviewService {
    private apiUrl = `${environment.apiUrl}/website-reviews`;

    constructor(private http: HttpClient) { }

    submitWebsiteReview(reviewData: {
        rating: number;
        title?: string;
        comment: string;
        category: string;
        page_url?: string;
    }): Observable<ReviewResponse<WebsiteReview>> {
        return this.http.post<ReviewResponse<WebsiteReview>>(this.apiUrl, reviewData);
    }

    getWebsiteReviews(filters?: {
        page?: number;
        limit?: number;
        category?: string;
        minRating?: number;
    }): Observable<ReviewResponse<WebsiteReview[]>> {
        let params = new HttpParams();

        if (filters) {
            if (filters.page) params = params.set('page', filters.page.toString());
            if (filters.limit) params = params.set('limit', filters.limit.toString());
            if (filters.category) params = params.set('category', filters.category);
            if (filters.minRating) params = params.set('minRating', filters.minRating.toString());
        }

        return this.http.get<ReviewResponse<WebsiteReview[]>>(this.apiUrl, { params });
    }

    getWebsiteReviewStats(): Observable<ReviewResponse<WebsiteReviewStats>> {
        return this.http.get<ReviewResponse<WebsiteReviewStats>>(`${this.apiUrl}/stats`);
    }

    getUserWebsiteReviews(
        userId: number,
        page: number = 1,
        limit: number = 10
    ): Observable<ReviewResponse<WebsiteReview[]>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<ReviewResponse<WebsiteReview[]>>(
            `${this.apiUrl}/user/${userId}`,
            { params }
        );
    }

    updateWebsiteReview(
        reviewId: number,
        updateData: {
            rating?: number;
            title?: string;
            comment?: string;
            category?: string;
        }
    ): Observable<ReviewResponse<WebsiteReview>> {
        return this.http.put<ReviewResponse<WebsiteReview>>(
            `${this.apiUrl}/${reviewId}`,
            updateData
        );
    }

    deleteWebsiteReview(reviewId: number): Observable<ReviewResponse<null>> {
        return this.http.delete<ReviewResponse<null>>(`${this.apiUrl}/${reviewId}`);
    }
}
