export const SPECIALTY_MAP: { [key: string]: string } = {
    'Cardiology': 'Cardiology',
    'Cardiologist': 'Cardiology',
    'ENT': 'ENT_Otolaryngology',
    'E.N.T.': 'ENT_Otolaryngology',
    'Otolaryngology': 'ENT_Otolaryngology',
    'Ophthalmology': 'Ophthalmology',
    'Eye': 'Ophthalmology',
    'Gastroenterology': 'Gastroenterology',
    'Dermatology': 'Dermatology',
    'Urology': 'Urology',
    'Neurology': 'Neurology',
    'General Surgery': 'General_Surgery',
    'Nephrology': 'Nephrology',
    'Pediatrics': 'Pediatrics',
    'Paediatrics': 'Pediatrics',
    'Psychiatry': 'Psychiatry',
    'Orthopedics': 'Orthopedics',
    'Orthopaedic': 'Orthopedics',
    'Orthopaedics': 'Orthopedics',
    'Endocrinology': 'Endocrinology',
    'Neurosurgery': 'Neuro_Surgery',
    'Neuro Surgery': 'Neuro_Surgery',
    'Physiotherapy': 'Physiotherapy',
    'Dentistry': 'Dentistry',
    'Dental': 'Dentistry',
    'Plastic Surgery': 'Plastic_Surgery',
    'General Medicine': 'General_Medicine',
    'Internal Medicine': 'General_Medicine',
    'Gynaecology': 'Gynaecology',
    'Obstetrics and Gynaecology': 'Gynaecology',
    'Radiology': 'Radiology',
    'Oncology': 'Oncology',
    'Pulmonology': 'Pulmonology',
    'Rheumatology': 'Rheumatology',
    'Haematology': 'Haematology',
    'Anesthesiology': 'Anesthesiology',
    'Emergency Medicine': 'Emergency_Medicine',
    'Critical Care': 'Critical_Care',
    'Bariatric Surgery': 'Bariatric_Surgery',
    'Diabetology': 'Diabetology',
    'Pathology': 'Pathology',
    'Kayachikitsa': 'Kayachikitsa',
    'Shalya Tantra': 'Shalya_Tantra',
    'Shalakya Tantra': 'Shalakya_Tantra',
    'Agada Tantra': 'Agada_Tantra',
    'Prasuti Tantra': 'Prasuti_Tantra',
    'Kaumarabhritya': 'Kaumarabhritya',
    'Panchakarma': 'Panchakarma',
    'Rasayana': 'Rasayana',
    'Vajikarana': 'Vajikarana',
    'Svasthavritta': 'Svasthavritta'
};

export function getEncyclopediaKey(specialty: string): string | null {
    if (!specialty) return null;

    // Direct match
    if (SPECIALTY_MAP[specialty]) return SPECIALTY_MAP[specialty];

    // Try case-insensitive and trimmed
    const clean = specialty.trim();
    const found = Object.keys(SPECIALTY_MAP).find(k => k.toLowerCase() === clean.toLowerCase());
    return found ? SPECIALTY_MAP[found] : null;
}
