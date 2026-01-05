const db = require('../config/database');

const principlesContent = [
    // Clinical Pillars (Previously static, now dynamic)
    {
        medicine_type: 'allopathy',
        content_type: 'guide',
        title: 'Evidence-Based Medicine (EBM)',
        description: 'The cornerstone of modern allopathy derived from rigorous research.',
        content: 'Every treatment protocol is derived from rigorous peer-reviewed research, double-blind clinical trials, and statistical validation. This ensures that clinical decisions are based on the best currently available evidence from systematic research.',
        image_url: 'fas fa-microscope',
        tags: JSON.stringify(['Clinical Trials', 'Peer-Review', 'Statistical Validation']),
        is_featured: true
    },
    {
        medicine_type: 'allopathy',
        content_type: 'guide',
        title: 'Biochemical Pharmacology',
        description: 'Targeted interventions working at the molecular level.',
        content: 'Utilizing precise chemical compounds to inhibit pathogens, balance hormones, or regulate neurotransmitters. Modern pharmacology focuses on pharmacokinetic precision and molecular specificity.',
        image_url: 'fas fa-pills',
        tags: JSON.stringify(['Molecular Specificity', 'Pharmacokinetics', 'Drug-Receptor Interaction']),
        is_featured: true
    },

    // Medical Evolution Timeline (New)
    {
        medicine_type: 'allopathy',
        content_type: 'article',
        title: '1928: Discovery of Penicillin',
        description: 'The dawn of the antibiotic era.',
        content: 'Alexander Fleming discovery of penicillin revolutionized medicine, turning previously fatal infections into treatable conditions and laying the foundation for modern microbiology.',
        image_url: 'fas fa-bacteria',
        tags: JSON.stringify(['Timeline', 'Antibiotics', 'Fleming']),
        author: '1928'
    },
    {
        medicine_type: 'allopathy',
        content_type: 'article',
        title: '1953: DNA Double Helix',
        description: 'Unlocking the blueprint of life.',
        content: 'Watson and Crick identification of the DNA structure paved the way for modern genetics, personalized medicine, and the understanding of hereditary diseases.',
        image_url: 'fas fa-dna',
        tags: JSON.stringify(['Timeline', 'Genetics', 'Molecular Biology']),
        author: '1953'
    },
    {
        medicine_type: 'allopathy',
        content_type: 'article',
        title: '1977: First MRI Image',
        description: 'Seeing inside the body without radiation.',
        content: 'The development of Magnetic Resonance Imaging allowed clinicians to view soft tissues with unprecedented clarity, revolutionizing diagnostics in neurology and oncology.',
        image_url: 'fas fa-magnet',
        tags: JSON.stringify(['Timeline', 'Diagnostics', 'Imaging']),
        author: '1977'
    },
    {
        medicine_type: 'allopathy',
        content_type: 'article',
        title: '2020: CRISPR Human Trials',
        description: 'The era of precision gene editing.',
        content: 'Directly editing the human genome to cure genetic disorders marks one of the most significant leaps in clinical intervention history.',
        image_url: 'fas fa-cut',
        tags: JSON.stringify(['Timeline', 'Gene Editing', 'Future']),
        author: '2020'
    },

    // Bio-Ethical Pillars (New)
    {
        medicine_type: 'allopathy',
        content_type: 'tip',
        title: 'Autonomy',
        description: 'Respecting the patient right to self-determination.',
        content: 'The obligation to respect the decisions of adults who have the capacity to make their own choices about their medical care.',
        image_url: 'fas fa-user-check',
        tags: JSON.stringify(['Ethics', 'Patient Rights'])
    },
    {
        medicine_type: 'allopathy',
        content_type: 'tip',
        title: 'Beneficence',
        description: 'Acting in the best interest of the patient.',
        content: 'The moral obligation to act for the benefit of others, contributing to their welfare and health.',
        image_url: 'fas fa-heartbeat',
        tags: JSON.stringify(['Ethics', 'Care'])
    },
    {
        medicine_type: 'allopathy',
        content_type: 'tip',
        title: 'Non-Maleficence',
        description: 'First, do no harm.',
        content: 'The duty to avoid inflicting harm on others, ensuring that the risks of an intervention do not outweigh the benefits.',
        image_url: 'fas fa-shield-alt',
        tags: JSON.stringify(['Ethics', 'Safety'])
    },
    {
        medicine_type: 'allopathy',
        content_type: 'tip',
        title: 'Justice',
        description: 'Fairness in medical resource distribution.',
        content: 'Ensuring that health resources, benefits, and burdens are distributed fairly among all members of society.',
        image_url: 'fas fa-balance-scale',
        tags: JSON.stringify(['Ethics', 'Equity'])
    }
];

async function seedPrinciples() {
    try {
        console.log('🌱 Seeding clinical principles content...');

        for (const item of principlesContent) {
            await db.execute(
                `INSERT INTO medicine_type_content 
                (medicine_type, content_type, title, description, content, image_url, tags, author, is_featured) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.medicine_type,
                    item.content_type,
                    item.title,
                    item.description,
                    item.content,
                    item.image_url,
                    item.tags,
                    item.author || 'Clinical Staff',
                    item.is_featured || false
                ]
            );
        }

        console.log('✅ Principles content seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedPrinciples();
