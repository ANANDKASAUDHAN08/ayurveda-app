import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type MedicineType = 'ayurveda' | 'homeopathy' | 'allopathy';
export type FilterMode = 'strict' | 'inclusive' | 'all';


export interface MedicineTypeInfo {
    id: MedicineType;
    name: string;
    tagline: string;
    icon: string;
    color: string;
    gradient: string;
    route: string;
}

@Injectable({
    providedIn: 'root'
})
export class MedicineTypeService {
    private readonly STORAGE_KEY = 'preferredMedicineType';
    private currentType$ = new BehaviorSubject<MedicineType>(this.getStoredType());

    private medicineTypes: MedicineTypeInfo[] = [
        {
            id: 'ayurveda',
            name: 'Ayurveda',
            tagline: 'Nature\'s Wisdom, Personalized',
            icon: '🌿',
            color: '#10b981',
            gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            route: '/ayurveda'
        },
        {
            id: 'homeopathy',
            name: 'Homeopathy',
            tagline: 'Gentle Healing, Deep Cure',
            icon: '💧',
            color: '#3b82f6',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            route: '/homeopathy'
        },
        {
            id: 'allopathy',
            name: 'Allopathy',
            tagline: 'Modern Science, Proven Results',
            icon: '⚕️',
            color: '#f97316',
            gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
            route: '/allopathy'
        }
    ];

    constructor() {
        // Initialize from localStorage
        const stored = this.getStoredType();
        if (stored) {
            this.currentType$.next(stored);
        }
    }

    /**
     * Get current medicine type as Observable
     */
    getCurrentType(): Observable<MedicineType> {
        return this.currentType$.asObservable();
    }

    /**
     * Get current medicine type value (synchronous)
     */
    getCurrentTypeValue(): MedicineType | 'all' {
        return this.currentType$.value;
    }

    /**
     * Set medicine type
     */
    setMedicineType(type: MedicineType | 'all'): void {
        this.currentType$.next(type as MedicineType);
        if (type !== 'all') {
            localStorage.setItem(this.STORAGE_KEY, type);
        }
    }

    /**
     * Get all medicine types
     */
    getAllTypes(): MedicineTypeInfo[] {
        return this.medicineTypes;
    }

    /**
     * Get medicine type info by ID
     */
    getTypeInfo(type: MedicineType): MedicineTypeInfo | undefined {
        return this.medicineTypes.find(t => t.id === type);
    }

    /**
     * Get stored medicine type from localStorage
     */
    private getStoredType(): MedicineType {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored && this.isValidType(stored)) {
                return stored as MedicineType;
            }
        } catch (error) {
            console.error('Error reading stored medicine type:', error);
        }
        return 'ayurveda'; // Default
    }

    /**
     * Validate medicine type
     */
    private isValidType(type: string): boolean {
        return ['ayurveda', 'homeopathy', 'allopathy'].includes(type);
    }

    /**
     * Get color for medicine type
     */
    getColor(type: MedicineType): string {
        return this.getTypeInfo(type)?.color || '#10b981';
    }

    /**
     * Get gradient for medicine type
     */
    getGradient(type: MedicineType): string {
        return this.getTypeInfo(type)?.gradient || 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)';
    }
}

