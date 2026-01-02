import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Medicine {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    benefits: string;
    is_bestseller: boolean;
    stock_status: string;
}

export interface Exercise {
    id: number;
    name: string;
    type: 'yoga' | 'pranayama' | 'meditation';
    description: string;
    duration_minutes: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    image_url: string;
    benefits: string;
    steps: string;
}

export interface Article {
    id: number;
    title: string;
    category: string;
    excerpt: string;
    content: string;
    image_url: string;
    author: string;
    read_time_minutes: number;
}

export interface Ritual {
    id: number;
    title: string;
    time_of_day: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
    description: string;
    icon: string;
    benefits: string;
}

export interface Herb {
    id: number;
    name: string;
    scientific_name: string;
    description: string;
    preview: string;
    benefits: string;
    usage_instructions: string;
    image_url: string;
    link: string;
    pacify: string[];
    aggravate: string[];
    tridosha: boolean;
    rasa: string[];
    guna: string[];
    virya: string;
    vipaka: string;
    prabhav: string[];
    is_herb_of_month: boolean;
}

export interface YogaPose {
    id: number;
    name: string;
    sanskrit_name: string;
    description: string;
    benefits: string;
    alignment_tips: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    image_url: string;
    is_pose_of_week: boolean;
}

export interface DashboardStats {
    doctors: number;
    medicines: number;
    exercises: number;
    articles: number;
}

@Injectable({
    providedIn: 'root'
})
export class AyurvedaService {
    private apiUrl = `${environment.apiUrl}/ayurveda`;

    constructor(private http: HttpClient) { }

    // Medicines
    getMedicines(limit?: number, featured?: boolean, q?: string): Observable<Medicine[]> {
        let url = `${this.apiUrl}/medicines`;
        const params: any = {};
        if (limit) params.limit = limit.toString();
        if (featured) params.featured = 'true';
        if (q) params.q = q;

        return this.http.get<{ success: boolean, data: Medicine[] }>(url, { params })
            .pipe(map(response => response.data));
    }

    getMedicineById(id: number): Observable<Medicine> {
        return this.http.get<{ success: boolean, data: Medicine }>(`${this.apiUrl}/medicines/${id}`)
            .pipe(map(response => response.data));
    }

    // Exercises (Yoga/Pranayama/Meditation)
    getExercises(limit?: number, type?: string, q?: string): Observable<Exercise[]> {
        let url = `${this.apiUrl}/exercises`;
        const params: any = {};
        if (limit) params.limit = limit.toString();
        if (type) params.type = type;
        if (q) params.q = q;

        return this.http.get<{ success: boolean, data: Exercise[] }>(url, { params })
            .pipe(map(response => response.data));
    }

    getExerciseById(id: number): Observable<Exercise> {
        return this.http.get<{ success: boolean, data: Exercise }>(`${this.apiUrl}/exercises/${id}`)
            .pipe(map(response => response.data));
    }

    // Articles
    getArticles(limit?: number, category?: string, q?: string): Observable<Article[]> {
        let url = `${this.apiUrl}/articles`;
        const params: any = {};
        if (limit) params.limit = limit.toString();
        if (category) params.category = category;
        if (q) params.q = q;

        return this.http.get<{ success: boolean, data: Article[] }>(url, { params })
            .pipe(map(response => response.data));
    }

    getArticleById(id: number): Observable<Article> {
        return this.http.get<{ success: boolean, data: Article }>(`${this.apiUrl}/articles/${id}`)
            .pipe(map(response => response.data));
    }

    // Rituals
    getRituals(timeOfDay?: string): Observable<Ritual[]> {
        let url = `${this.apiUrl}/rituals`;
        const params: any = {};
        if (timeOfDay) params.time_of_day = timeOfDay;

        return this.http.get<{ success: boolean, data: Ritual[] }>(url, { params })
            .pipe(map(response => response.data));
    }

    // Herbs
    getHerbs(params: { herb_of_month?: boolean, pacify?: string, aggravate?: string, q?: string } = {}): Observable<Herb[]> {
        let url = `${this.apiUrl}/herbs`;
        const queryParams: any = {};
        if (params.herb_of_month) queryParams.herb_of_month = 'true';
        if (params.pacify) queryParams.pacify = params.pacify;
        if (params.aggravate) queryParams.aggravate = params.aggravate;
        if (params.q) queryParams.q = params.q;

        return this.http.get<{ success: boolean, data: Herb[] }>(url, { params: queryParams })
            .pipe(map(response => response.data));
    }

    // Yoga Poses
    getYogaPoses(poseOfWeek?: boolean): Observable<YogaPose[]> {
        let url = `${this.apiUrl}/yoga-poses`;
        const params: any = {};
        if (poseOfWeek) params.pose_of_week = 'true';

        return this.http.get<{ success: boolean, data: YogaPose[] }>(url, { params })
            .pipe(map(response => response.data));
    }

    // Dashboard Stats
    getStats(): Observable<DashboardStats> {
        return this.http.get<{ success: boolean, data: DashboardStats }>(`${this.apiUrl}/stats`)
            .pipe(map(response => response.data));
    }
}
