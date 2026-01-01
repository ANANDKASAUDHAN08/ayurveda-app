import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AyurvedaService, Article, Herb } from '../../../../shared/services/ayurveda.service';

@Component({
  selector: 'app-ayurveda-article',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ayurveda-article.component.html',
  styleUrl: './ayurveda-article.component.css'
})
export class AyurvedaArticleComponent implements OnInit {
  articles: Article[] = [];
  herbOfMonth: Herb | null = null;
  wisdomCards = [
    { front: 'What is Agni?', back: 'Agni is the digestive fire, responsible for metabolism and transformation.', icon: '🔥' },
    { front: 'Meaning of Ojas', back: 'Ojas is the essential energy of the immune system and vitality.', icon: '🛡️' },
    { front: 'The 3 Doshas', back: 'Vata (Air/Space), Pitta (Fire/Water), Kapha (Earth/Water).', icon: '🌿' },
    { front: 'What is Ama?', back: 'Ama refers to toxins or undigested metabolic waste in the body.', icon: '🧪' }
  ];
  currentCardIndex = 0;
  isFlipped = false;
  filteredArticles: Article[] = [];
  categories: string[] = ['All', 'Ayurveda 101', 'Wellness', 'Lifestyle', 'Nutrition'];
  activeCategory: string = 'All';
  searchQuery: string = '';
  loading = true;

  constructor(private ayurvedaService: AyurvedaService) { }

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles() {
    this.loading = true;
    this.ayurvedaService.getArticles(10, this.activeCategory, this.searchQuery).subscribe({
      next: (data) => {
        this.articles = data;
        this.filteredArticles = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching articles:', err);
        this.loading = false;
      }
    });
    this.loadHerbOfMonth();
  }

  loadHerbOfMonth(): void {
    this.ayurvedaService.getHerbs({ herb_of_month: true }).subscribe({
      next: (data) => {
        if (data.length > 0) this.herbOfMonth = data[0];
      }
    });
  }

  flipCard(): void {
    this.isFlipped = !this.isFlipped;
  }

  nextCard(): void {
    this.isFlipped = false;
    setTimeout(() => {
      this.currentCardIndex = (this.currentCardIndex + 1) % this.wisdomCards.length;
    }, 150);
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value;
    this.loadArticles();
  }

  filterByCategory(category: string) {
    this.activeCategory = category;
    this.loadArticles();
  }
}
