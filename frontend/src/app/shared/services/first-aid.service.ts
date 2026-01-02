import { Injectable } from '@angular/core';

export interface FirstAidStep {
  step_number: number;
  instruction: string;
  warning?: string;
}

export interface FirstAidGuide {
  id: string;
  title: string;
  category: 'critical' | 'serious' | 'common';
  icon: string;
  color: string;
  symptoms: string[];
  steps: FirstAidStep[];
  warnings: string[];
  when_to_call_911: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirstAidService {

  private guides: FirstAidGuide[] = [
    // CRITICAL EMERGENCIES
    {
      id: 'cpr',
      title: 'CPR & Drowning',
      category: 'critical',
      icon: 'fa-heartbeat',
      color: 'red',
      symptoms: ['No breathing', 'No pulse', 'Unconscious', 'Blue lips or skin'],
      steps: [
        { step_number: 1, instruction: '**Call 108 immediately** - Get help first!' },
        { step_number: 2, instruction: 'Check if person is breathing - Look, listen, feel for 10 seconds' },
        { step_number: 3, instruction: 'If not breathing: Lay person flat on firm surface' },
        { step_number: 4, instruction: 'Tilt head back, lift chin to open airway' },
        { step_number: 5, instruction: 'Give 2 rescue breaths (1 second each, watch chest rise)' },
        { step_number: 6, instruction: 'Start chest compressions: Place hands center of chest' },
        { step_number: 7, instruction: 'Push hard and fast: 100-120 compressions per minute' },
        { step_number: 8, instruction: 'Compress at least 2 inches deep for adults' },
        { step_number: 9, instruction: 'Do 30 compressions, then 2 breaths. Repeat.' },
        { step_number: 10, instruction: 'Continue until help arrives or person breathes' }
      ],
      warnings: [
        'Do NOT give up - Continue CPR until professionals arrive',
        'Do NOT stop to check for pulse during CPR',
        'Children & infants need gentler compressions'
      ],
      when_to_call_911: 'IMMEDIATELY - Before starting CPR'
    },
    {
      id: 'heart-attack',
      title: 'Heart Attack',
      category: 'critical',
      icon: 'fa-heart',
      color: 'red',
      symptoms: ['Chest pain/pressure', 'Pain in arm, jaw, neck', 'Shortness of breath', 'Sweating', 'Nausea'],
      steps: [
        { step_number: 1, instruction: '**Call 108 immediately**' },
        { step_number: 2, instruction: 'Help person sit down and rest comfortably' },
        { step_number: 3, instruction: 'Loosen any tight clothing around neck/chest' },
        { step_number: 4, instruction: 'If conscious, give aspirin (300mg) to chew slowly' },
        { step_number: 5, instruction: 'Stay calm and reassure the person' },
        { step_number: 6, instruction: 'Monitor breathing and consciousness' },
        { step_number: 7, instruction: 'Be prepared to perform CPR if needed' }
      ],
      warnings: [
        'NEVER drive the person to hospital yourself',
        'Do NOT give food or water',
        'Do NOT leave the person alone'
      ],
      when_to_call_911: 'Immediately if chest pain lasts more than 5 minutes'
    },
    {
      id: 'stroke',
      title: 'Stroke (FAST)',
      category: 'critical',
      icon: 'fa-brain',
      color: 'red',
      symptoms: ['Face drooping', 'Arm weakness', 'Speech difficulty', 'Sudden confusion', 'Vision problems'],
      steps: [
        { step_number: 1, instruction: '**Remember FAST: Face, Arms, Speech, Time**' },
        { step_number: 2, instruction: '**Call 108 immediately** - Note time symptoms started' },
        { step_number: 3, instruction: 'Keep person calm and comfortable' },
        { step_number: 4, instruction: 'Lay person down with head slightly elevated' },
        { step_number: 5, instruction: 'Do NOT give food, water, or medicine' },
        { step_number: 6, instruction: 'Monitor breathing and be ready for CPR' },
        { step_number: 7, instruction: 'Note all symptoms and when they started' }
      ],
      warnings: [
        'Time is critical - Brain damage occurs quickly',
        'NEVER give aspirin for stroke (only for heart attack)',
        'Do NOT let person eat or drink'
      ],
      when_to_call_911: 'IMMEDIATELY - Every minute counts!'
    },
    {
      id: 'severe-bleeding',
      title: 'Severe Bleeding',
      category: 'critical',
      icon: 'fa-tint',
      color: 'red',
      symptoms: ['Blood spurting or gushing', 'Blood soaking through bandages', 'Limb severed'],
      steps: [
        { step_number: 1, instruction: '**Call 108 if bleeding is severe**' },
        { step_number: 2, instruction: 'Wear gloves if available (protect yourself)' },
        { step_number: 3, instruction: 'Have person lie down, elevate legs if possible' },
        { step_number: 4, instruction: 'Apply direct pressure with clean cloth' },
        { step_number: 5, instruction: 'Maintain firm, constant pressure for 10-15 minutes' },
        { step_number: 6, instruction: 'If blood soaks through, add more cloth on top' },
        { step_number: 7, instruction: 'Apply pressure bandage once bleeding slows' },
        { step_number: 8, instruction: 'Keep injured area elevated above heart' }
      ],
      warnings: [
        'Do NOT remove objects stuck in wound',
        'Do NOT peek under bandage while applying pressure',
        'Use tourniquet ONLY as last resort for limb bleeding'
      ],
      when_to_call_911: 'If bleeding doesn\'t stop after 10 minutes of pressure'
    },
    {
      id: 'choking',
      title: 'Choking Adult',
      category: 'critical',
      icon: 'fa-lungs',
      color: 'red',
      symptoms: ['Cannot speak', 'Gasping for air', 'Clutching throat', 'Blue face'],
      steps: [
        { step_number: 1, instruction: 'Ask "Are you choking?" - If they can\'t speak, act fast!' },
        { step_number: 2, instruction: 'Stand behind person, wrap arms around waist' },
        { step_number: 3, instruction: 'Make a fist, place above belly button' },
        { step_number: 4, instruction: 'Grasp fist with other hand' },
        { step_number: 5, instruction: 'Give quick upward thrusts (Heimlich maneuver)' },
        { step_number: 6, instruction: 'Repeat until object comes out' },
        { step_number: 7, instruction: 'If person becomes unconscious, lower to ground and start CPR' }
      ],
      warnings: [
        'Do NOT slap back for adults (ineffective)',
        'If pregnant or obese, do chest thrusts instead',
        'Call 108 if object doesn\'t come out'
      ],
      when_to_call_911: 'If choking person becomes unconscious'
    },

    // SERIOUS EMERGENCIES
    {
      id: 'burns',
      title: 'Burns',
      category: 'serious',
      icon: 'fa-fire',
      color: 'orange',
      symptoms: ['Red skin', 'Blisters', 'Charred skin', 'Severe pain'],
      steps: [
        { step_number: 1, instruction: 'Remove from heat source immediately' },
        { step_number: 2, instruction: 'Remove jewelry/tight clothing before swelling' },
        { step_number: 3, instruction: 'Cool burn with cool (not ice cold) running water for 10-20 minutes' },
        { step_number: 4, instruction: 'Cover with sterile, non-stick bandage' },
        { step_number: 5, instruction: 'Give over-the-counter pain medicine' },
        { step_number: 6, instruction: 'Elevate burned area if possible' }
      ],
      warnings: [
        'NEVER use ice directly on burns',
        'NEVER apply butter, oil, or ointments',
        'Do NOT break blisters'
      ],
      when_to_call_911: 'For large burns, burns on face/hands/feet, or 3rd degree burns'
    },
    {
      id: 'fractures',
      title: 'Broken Bones',
      category: 'serious',
      icon: 'fa-bone',
      color: 'orange',
      symptoms: ['Severe pain', 'Swelling', 'Deformity', 'Cannot move limb'],
      steps: [
        { step_number: 1, instruction: 'Do NOT move the injured area' },
        { step_number: 2, instruction: 'Control any bleeding with clean cloth' },
        { step_number: 3, instruction: 'Apply ice pack wrapped in cloth (20 minutes on, 20 off)' },
        { step_number: 4, instruction: 'Immobilize the area with splint if trained' },
        { step_number: 5, instruction: 'Keep person still and comfortable' },
        { step_number: 6, instruction: 'Treat for shock - elevate legs, keep warm' }
      ],
      warnings: [
        'Do NOT try to realign bone',
        'Do NOT move person if spine injury suspected',
        'Do NOT give anything to eat or drink'
      ],
      when_to_call_911: 'For suspected spine/neck/skull fractures or if bone pierces skin'
    },
    {
      id: 'poisoning',
      title: 'Poisoning',
      category: 'serious',
      icon: 'fa-skull-crossbones',
      color: 'orange',
      symptoms: ['Nausea/vomiting', 'Confusion', 'Difficulty breathing', 'Burns around mouth'],
      steps: [
        { step_number: 1, instruction: '**Call poison control or 108 immediately**' },
        { step_number: 2, instruction: 'Try to identify what was swallowed/inhaled' },
        { step_number: 3, instruction: 'Have container/label ready when calling' },
        { step_number: 4, instruction: 'If conscious, have person spit out any remaining substance' },
        { step_number: 5, instruction: 'Follow instructions from poison control' }
      ],
      warnings: [
        'Do NOT induce vomiting unless told to by professionals',
        'Do NOT give activated charcoal unless instructed',
        'Keep calm - panic makes things worse'
      ],
      when_to_call_911: 'Immediately - Poisoning is always an emergency'
    },

    // COMMON INJURIES
    {
      id: 'cuts-scrapes',
      title: 'Cuts & Scrapes',
      category: 'common',
      icon: 'fa-band-aid',
      color: 'blue',
      symptoms: ['Bleeding', 'Open wound', 'Dirt in wound'],
      steps: [
        { step_number: 1, instruction: 'Wash hands thoroughly' },
        { step_number: 2, instruction: 'Stop bleeding by applying gentle pressure' },
        { step_number: 3, instruction: 'Clean wound with soap and water' },
        { step_number: 4, instruction: 'Apply antibiotic ointment' },
        { step_number: 5, instruction: 'Cover with sterile bandage' },
        { step_number: 6, instruction: 'Change bandage daily or when wet/dirty' }
      ],
      warnings: [
        'Watch for signs of infection (redness, warmth, pus)',
        'Get tetanus shot if not up to date',
        'Seek medical help if signs of infection appear'
      ],
      when_to_call_911: 'If bleeding doesn\'t stop after 10 minutes pressure'
    },
    {
      id: 'sprains',
      title: 'Sprains & Strains',
      category: 'common',
      icon: 'fa-running',
      color: 'blue',
      symptoms: ['Pain', 'Swelling', 'Bruising', 'Limited movement'],
      steps: [
        { step_number: 1, instruction: '**Remember RICE: Rest, Ice, Compression, Elevation**' },
        { step_number: 2, instruction: 'Rest - Avoid using injured area' },
        { step_number: 3, instruction: 'Ice - Apply ice pack for 20 minutes every 2-3 hours' },
        { step_number: 4, instruction: 'Compression - Wrap with elastic bandage (not too tight)' },
        { step_number: 5, instruction: 'Elevation - Raise above heart level when possible' },
        { step_number: 6, instruction: 'Take pain medication if needed' }
      ],
      warnings: [
        'Do NOT use heat for first 48 hours',
        'Do NOT wrap too tightly (check for numbness/tingling)',
        'If severe pain or no improvement in 48 hours, see doctor'
      ],
      when_to_call_911: 'If severe pain, deformity, or suspected fracture'
    },
    {
      id: 'nosebleeds',
      title: 'Nosebleeds',
      category: 'common',
      icon: 'fa-head-side-cough',
      color: 'blue',
      symptoms: ['Blood from nose'],
      steps: [
        { step_number: 1, instruction: 'Sit upright, lean slightly forward' },
        { step_number: 2, instruction: 'Pinch soft part of nose firmly' },
        { step_number: 3, instruction: 'Hold for 10-15 minutes continuously' },
        { step_number: 4, instruction: 'Breathe through mouth' },
        { step_number: 5, instruction: 'After bleeding stops, avoid blowing nose for several hours' }
      ],
      warnings: [
        'Do NOT tilt head back (can cause swallowing blood)',
        'Do NOT pack nose with tissues',
        'Do NOT pick or blow nose after bleeding stops'
      ],
      when_to_call_911: 'If bleeding doesn\'t stop after 30 minutes or after head injury'
    }
  ];

  constructor() { }

  getAllGuides(): FirstAidGuide[] {
    return this.guides;
  }

  getGuideById(id: string): FirstAidGuide | undefined {
    return this.guides.find(guide => guide.id === id);
  }

  searchGuides(query: string): FirstAidGuide[] {
    const lowerQuery = query.toLowerCase();
    return this.guides.filter(guide =>
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.symptoms.some(symptom => symptom.toLowerCase().includes(lowerQuery))
    );
  }

  getGuidesByCategory(category: 'critical' | 'serious' | 'common'): FirstAidGuide[] {
    return this.guides.filter(guide => guide.category === category);
  }
}

