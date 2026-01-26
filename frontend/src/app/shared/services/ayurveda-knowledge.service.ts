import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { forkJoin, catchError, Observable, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface AyurvedaKnowledgeItem {
    id: string | number;
    name?: string;
    title?: string;
    description?: string;
    botanicalName?: string;
    type?: string;
    category?: string;
    difficulty?: string;
    benefit?: string;
    benefits?: string[];
    usage?: string;
    dosage?: string;
    location?: string;
    contact?: string;
    ailment?: string;
    primaryAilment?: string;
    method?: string;
    brand?: string;
    composition?: string;
    price?: string;
    dataType: 'herb' | 'medicine' | 'hospital' | 'yoga' | 'remedy' | 'allopathy' | 'homeopathy' | 'knowledge';

    // Expanded fields from CSV/Database
    disease?: string;
    hindi_name?: string;
    marathi_name?: string;
    symptoms?: string;
    diagnosis_tests?: string;
    severity?: string;
    treatment_duration?: string;
    medical_history?: string;
    current_medications?: string;
    risk_factors?: string;
    environmental_factors?: string;
    sleep_patterns?: string;
    stress_levels?: string;
    physical_activity?: string;
    family_history?: string;
    dietary_habits?: string;
    allergies?: string;
    seasonal_variation?: string;
    age_group?: string;
    gender?: string;
    occupation_lifestyle?: string;
    cultural_preferences?: string;
    herbal_remedies?: string;
    ayurvedic_herbs?: string;
    ayurvedic_herbal_remedies?: string;
    formulation?: string;
    doshas?: string;
    constitution_prakriti?: string;
    diet_lifestyle_recommendations?: string;
    yoga_physical_therapy?: string;
    medical_intervention?: string;
    prevention?: string;
    prognosis?: string;
    complications?: string;
    patient_recommendations?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AyurvedaKnowledgeService {
    private dataUrl = 'assets/data/ayurveda-knowledge.json';
    private apiUrl = `${environment.apiUrl}/ayurveda/knowledge`;

    constructor(private http: HttpClient) { }

    search(query: string, category?: string): Observable<AyurvedaKnowledgeItem[]> {
        if (!query || query.trim().length < 2) {
            return of([]);
        }

        const q = query.toLowerCase().trim();

        // 1. Search in local JSON
        const localSearch$ = this.http.get<any>(this.dataUrl).pipe(
            map(data => {
                const items: AyurvedaKnowledgeItem[] = [
                    ...(data.herbs || []).map((h: any) => ({ ...h, dataType: 'herb' })),
                    ...(data.medicines || []).map((m: any) => ({ ...m, dataType: 'medicine' })),
                    ...(data.allopathy || []).map((a: any) => ({ ...a, dataType: 'allopathy' })),
                    ...(data.homeopathy || []).map((hom: any) => ({ ...hom, dataType: 'homeopathy' })),
                    ...(data.hospitals || []).map((hos: any) => ({ ...hos, dataType: 'hospital' })),
                    ...(data.yogas || []).map((y: any) => ({ ...y, dataType: 'yoga' })),
                    ...(data.remedies || []).map((r: any) => ({ ...r, dataType: 'remedy', name: r.ailment }))
                ];

                let filtered = category && category !== 'all'
                    ? items.filter(item => item.dataType === category)
                    : items;

                return filtered.filter(item => {
                    const searchFields = [
                        item.name, item.title, item.brand, item.composition,
                        item.ailment, item.primaryAilment, item.location,
                        ...(item.benefits || []), item.benefit, item.category
                    ].filter(Boolean).map(f => f!.toLowerCase());

                    return searchFields.some(field => field.includes(q));
                });
            }),
            catchError(() => of([]))
        );

        // 2. Search in Backend (CSV Dataset - Ailments)
        const backendSearch$ = this.http.get<any>(`${this.apiUrl}?q=${q}`).pipe(
            map(res => (res.data || []).map((item: any) => ({
                ...item,
                dataType: 'knowledge',
                name: item.disease
            }))),
            catchError(() => of([]))
        );

        // 3. Search in Backend (Herbs Table)
        const backendHerbsUrl = `${environment.apiUrl}/ayurveda/herbs`;
        const backendHerbsSearch$ = this.http.get<any>(`${backendHerbsUrl}?q=${q}`).pipe(
            map(res => (res.data || []).map((item: any) => ({
                ...item,
                dataType: 'herb'
            }))),
            catchError(() => of([]))
        );

        // 4. Combine results
        return forkJoin([localSearch$, backendSearch$, backendHerbsSearch$]).pipe(
            map(([localResults, backendResults, backendHerbs]) => {
                let results: AyurvedaKnowledgeItem[] = [];

                if (category === 'herb') {
                    results = [...backendHerbs, ...localResults.filter(i => i.dataType === 'herb')];
                } else if (category === 'knowledge') {
                    results = backendResults;
                } else if (category && category !== 'all') {
                    // Other specific local categories
                    results = localResults.filter(i => i.dataType === category);
                } else {
                    // 'all' category
                    results = [...backendHerbs, ...backendResults, ...localResults];
                }

                // Prioritization / Sorting Logic
                results.sort((a, b) => {
                    const nameA = (a.name || a.title || a.disease || a.ailment || '').toLowerCase();
                    const nameB = (b.name || b.title || b.disease || b.ailment || '').toLowerCase();

                    // 1. Exact Name match gets highest priority
                    const exactA = nameA === q;
                    const exactB = nameB === q;
                    if (exactA && !exactB) return -1;
                    if (!exactA && exactB) return 1;

                    // 2. Inclusion match at start of string
                    const startA = nameA.startsWith(q);
                    const startB = nameB.startsWith(q);
                    if (startA && !startB) return -1;
                    if (!startA && startB) return 1;

                    // 3. Type priority: Herbs > Medicines > Knowledge
                    const priority: { [key: string]: number } = { 'herb': 1, 'medicine': 2, 'remedy': 3, 'knowledge': 4 };
                    const pA = priority[a.dataType] || 10;
                    const pB = priority[b.dataType] || 10;
                    if (pA !== pB) return pA - pB;

                    return 0;
                });

                // Remove duplicates if any (by ID and Type)
                const seen = new Set();
                return results.filter(item => {
                    const key = `${item.dataType}-${item.id}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            })
        );
    }

    getDetails(id: string | number, type: string): Observable<AyurvedaKnowledgeItem | undefined> {
        if (type === 'knowledge') {
            return this.http.get<any>(`${this.apiUrl}?id=${id}`).pipe(
                map(res => res.data && res.data[0] ? { ...res.data[0], dataType: 'knowledge', name: res.data[0].disease } : undefined),
                catchError(() => of(undefined))
            );
        }

        return this.http.get<any>(this.dataUrl).pipe(
            map(data => {
                const key = type + 's';
                const list = data[key] || [];
                return list.find((item: any) => item.id === id);
            })
        );
    }
}
