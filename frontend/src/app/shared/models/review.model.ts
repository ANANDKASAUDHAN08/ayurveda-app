export interface HospitalReview {
    id: number;
    user_id: number;
    user_name?: string;
    hospital_id: number;
    hospital_source: 'hospitals' | 'nabh_hospitals' | 'hospitals_with_specialties' | 'health_centres';
    rating: number; // 1-5
    title?: string;
    comment: string;
    aspects?: HospitalAspects;
    created_at: string;
    updated_at: string;
}

export interface HospitalAspects {
    cleanliness?: number; // 1-5
    staff?: number; // 1-5
    facilities?: number; // 1-5
    waiting_time?: number; // 1-5
}

export interface PharmacyReview {
    id: number;
    user_id: number;
    user_name?: string;
    pharmacy_id: number;
    rating: number; // 1-5
    title?: string;
    comment: string;
    created_at: string;
    updated_at: string;
}

export interface WebsiteReview {
    id: number;
    user_id: number;
    user_name?: string;
    rating: number; // 1-5
    title?: string;
    comment: string;
    category: 'general' | 'ui_ux' | 'features' | 'performance' | 'suggestion' | 'bug_report';
    page_url?: string;
    created_at: string;
    updated_at: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export interface WebsiteReviewStats extends ReviewStats {
    categoryDistribution: {
        [key: string]: number;
    };
}

export interface ReviewPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ReviewResponse<T> {
    success: boolean;
    data: T;
    pagination?: ReviewPagination;
    message?: string;
}
