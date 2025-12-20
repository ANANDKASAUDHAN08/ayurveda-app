import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-help-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-support.component.html',
  styleUrl: './help-support.component.css'
})
export class HelpSupportComponent {
  searchQuery: string = '';
  selectedCategory: string = 'General';

  categories = ['General', 'Appointments', 'Orders', 'Payments', 'Account'];

  faqs = [
    {
      question: 'How do I book an appointment with a doctor?',
      answer: 'You can search for a doctor using the "Find Doctors" feature, select a time slot, and click "Book Appointment". You will receive a confirmation via email and SMS.',
      category: 'Appointments'
    },
    {
      question: 'How can I track my medicine order?',
      answer: 'Go to "My Orders" in your profile dashboard to see real-time updates on your medicine delivery status.',
      category: 'Orders'
    },
    {
      question: 'What are the available payment methods?',
      answer: 'We support all major credit/debit cards, UPI, Net Banking, and popular wallets like Paytm and PhonePe.',
      category: 'Payments'
    },
    {
      question: 'How long does it take to get lab test results?',
      answer: 'Most diagnostic reports are available within 24-48 hours. You will be notified once your digital report is ready for download.',
      category: 'Orders'
    },
    {
      question: 'Is my health data secure?',
      answer: 'Yes, we use enterprise-grade encryption and follow strict HIPAA-compliant guidelines to ensure your medical records are private and secure.',
      category: 'General'
    },
    {
      question: 'How do I change my profile information?',
      answer: 'You can update your personal details, saved addresses, and contact information by going to the "Settings" page in your account.',
      category: 'Account'
    }
  ];

  get filteredFaqs() {
    return this.faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategory === 'All' || faq.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  showAnswer: { [key: number]: boolean } = {};

  toggleFaq(index: number) {
    this.showAnswer[index] = !this.showAnswer[index];
  }
}
