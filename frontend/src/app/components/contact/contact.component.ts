import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  showChat = false;
  activeFormTab: 'general' | 'technical' | 'billing' = 'general';

  faqs: FAQ[] = [
    {
      question: 'How do I book an appointment with a doctor?',
      answer: 'You can book an appointment by searching for doctors in your area, viewing their profiles, and selecting an available time slot. You\'ll receive instant confirmation via email and SMS.',
      open: false
    },
    {
      question: 'Can I reschedule or cancel my appointment?',
      answer: 'Yes! You can reschedule or cancel appointments from your dashboard up to 2 hours before the scheduled time. Simply go to "My Appointments" and select the appointment you wish to modify.',
      open: false
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets. All payments are secure and encrypted.',
      open: false
    },
    {
      question: 'How do I track my medicine orders?',
      answer: 'Once your order is placed, you\'ll receive a tracking link via email and SMS. You can also track your order status in real-time from the "My Orders" section in your dashboard.',
      open: false
    },
    {
      question: 'Is my health information secure?',
      answer: 'Absolutely! We use bank-level encryption to protect your data. We are fully HIPAA compliant and never share your information without your explicit consent.',
      open: false
    },
    {
      question: 'How do I contact my doctor after consultation?',
      answer: 'You can message your doctor directly through our secure messaging feature available in your dashboard. Doctors typically respond within 24 hours.',
      open: false
    }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();

        // Reset success message after 5 seconds
        setTimeout(() => this.submitSuccess = false, 5000);
      }, 1500);
    }
  }

  toggleChat() {
    this.showChat = !this.showChat;
  }

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
