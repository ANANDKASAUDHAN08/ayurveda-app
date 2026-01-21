export interface ServiceCard {
    id: string;
    title: string;
    icon: string; // Font Awesome class
    description: string;
    route: string;
    category: 'care' | 'shop' | 'emergency' | 'other';
    badge?: number;
    color: string; // Tailwind color class (e.g., 'emerald', 'blue', 'red')
}
