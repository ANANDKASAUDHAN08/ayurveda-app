export interface LabTest {
    id: number;
    name: string;
    category: string;
    price: number;
    discounted_price: number;
    description: string;
    purpose?: string;
    preparation?: string;
    includes?: string;
    parameters_count?: number;
    parameters_list?: string[];
    reference_range?: any;
    clinical_utility?: string;
    loinc_code?: string;
    is_popular: boolean;
    sample_type: string;
    fasting_required: boolean;
    report_time: string;
}

export interface Laboratory {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    website: string;
    timings: string;
    services: string[] | string;
    latitude: number;
    longitude: number;
    is_nabl_accredited: boolean;
    is_cghs_empanelled: boolean;
    data_source: string;
    distance?: number;
}
