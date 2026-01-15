import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService } from '../../services/chatbot.service';
import { AuthService } from '../../services/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  type?: string;
  options?: any[];
  data?: any;
  timestamp: Date;
  action?: string;
  upgradeMessage?: string;
  price?: number;
}

interface ChatSession {
  sessionId: string;
  createdAt: Date;
  lastMessageAt: Date;
  firstMessage: string;
  messageCount: number;
  status: string;
  pinned?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  animations: [
    trigger('slideUp', [
      state('void', style({ transform: 'translateY(100%)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('300ms ease-in'))
    ])
  ]
})
export class ChatbotComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;
  sessionId?: string;
  subscription: any;
  remainingMessages: number | string = 10;
  limitReached = false;
  unreadCount = 0;
  showQuickActions = true;
  isLoggedIn = false;
  private shouldScrollToBottom = false;
  historySearchQuery: string = '';
  showClearAllModal: boolean = false;
  isClearingAll: boolean = false;

  private activeSubscriptions: Subscription[] = [];
  private hasStartedSession = false;
  isWaitingForResponse = false;

  // Session management
  chatSessions: ChatSession[] = [];
  currentSessionId: string | null = null;
  showHistory = false;
  loadingSessions = false;
  activeSessionMenu: number | null = null;
  sessionToDelete: ChatSession | null = null;
  sessionToRename: ChatSession | null = null;
  renameInput: string = '';

  quickActions = [
    { icon: 'fa-solid fa-stethoscope', label: 'Check Symptoms', action: 'CHECK_SYMPTOMS' },
    { icon: 'fa-solid fa-calendar-check', label: 'Book Appointment', action: 'BOOK_APPOINTMENT' },
    { icon: 'fa-solid fa-first-aid', label: 'Emergency', action: 'EMERGENCY' }
  ];

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService,
    public router: Router,
    private el: ElementRef,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    // Track auth status
    const authSub = this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
      if (status && !this.hasStartedSession) {
        this.loadChatSessions();
      } else if (!status) {
        // Clear state if logged out
        this.messages = [];
        this.chatSessions = [];
        this.sessionId = undefined;
        this.currentSessionId = null;
        this.hasStartedSession = false;
        this.remainingMessages = 10;
        this.unreadCount = 0;
        this.limitReached = false;
      }
    });
    this.activeSubscriptions.push(authSub);
  }

  ngOnDestroy() {
    // Clean up all active subscriptions
    this.cancelAllRequests();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // Update toggleChat
  async toggleChat(event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevents the outside click listener from firing
    }

    this.isOpen = !this.isOpen;

    if (this.isOpen && !this.hasStartedSession) {
      this.startSession();
    }

    if (this.isOpen) {
      this.unreadCount = 0;
      this.shouldScrollToBottom = true;
    }
  }

  // Update minimizeChat
  minimizeChat(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = false;
  }

  async startSession() {
    if (this.hasStartedSession) return;
    this.hasStartedSession = true;

    try {
      const sub = this.chatbotService.startSession().subscribe({
        next: (response) => {
          this.sessionId = response.sessionId;
          this.remainingMessages = response.remaining;

          // Add welcome message
          this.addBotMessage({
            text: response.welcomeMessage,
            type: 'OPTIONS',
            options: [
              { id: 1, text: '🔍 Check my symptoms', action: 'CHECK_SYMPTOMS' },
              { id: 2, text: '📅 Book a doctor', action: 'BOOK_APPOINTMENT' },
              { id: 3, text: '🧘 Take Prakriti Quiz', action: 'PRAKRITI_QUIZ' },
              { id: 4, text: '🚨 Emergency help', action: 'EMERGENCY' }
            ]
          });
        },
        error: (error) => {
          console.error('Failed to start session:', error);
          this.hasStartedSession = false; // Reset on failure
          this.addBotMessage({
            text: 'Sorry, I couldn\'t start the chat. Please try again.',
            type: 'text'
          });
        }
      });
      this.activeSubscriptions.push(sub);
    } catch (error) {
      this.hasStartedSession = false; // Reset on failure
      console.error('Start session error:', error);
    }
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || !this.sessionId) return;

    const userMessage = this.currentMessage;
    this.currentMessage = '';

    // Add user message
    this.addUserMessage(userMessage);

    // Show typing indicator
    this.isTyping = true;
    this.isWaitingForResponse = true;

    try {
      const sub = this.chatbotService.sendMessage(this.sessionId, userMessage).subscribe({
        next: async (response) => {
          // Simulate delay for better UX
          await this.delay(1000);

          this.isTyping = false;
          this.isWaitingForResponse = false;

          // Handle response
          if (response.response.type === 'LIMIT_REACHED') {
            this.limitReached = true;
            this.addBotMessage({
              text: response.response.message,
              type: 'UPGRADE_PROMPT',
              upgradeMessage: response.response.upgradeMessage || 'Get unlimited conversations',
              price: response.response.price || 4.99
            });
          } else {
            this.addBotMessage(response.response);
          }

          // Update remaining count
          if (response.remaining !== undefined) {
            this.remainingMessages = response.remaining;
          }
        },
        error: (error) => {
          this.isTyping = false;
          this.isWaitingForResponse = false;
          console.error('Send message error:', error);
          this.addBotMessage({
            text: 'Sorry, I encountered an error. Please try again.',
            type: 'text'
          });
        }
      });
      this.activeSubscriptions.push(sub);
    } catch (error) {
      this.isTyping = false;
      this.isWaitingForResponse = false;
      console.error('Message error:', error);
    }
  }

  async selectOption(option: any) {
    // Hide quick actions
    this.showQuickActions = false;

    // Show user's choice
    this.addUserMessage(option.text);

    // Handle action
    await this.handleAction(option.action);
  }

  async sendQuickAction(action: any) {
    this.addUserMessage(action.label);
    await this.handleAction(action.action);
  }

  async handleAction(action: string) {
    this.isTyping = true;
    this.isWaitingForResponse = true;
    await this.delay(500);

    try {
      if (!this.sessionId) return;

      const sub = this.chatbotService.sendMessage(this.sessionId, `action:${action}`).subscribe({
        next: (response) => {
          this.isTyping = false;
          this.isWaitingForResponse = false;
          this.addBotMessage(response.response);

          // Handle special actions
          if (response.response.action === 'OPEN_SYMPTOM_CHECKER') {
            setTimeout(() => {
              this.router.navigateByUrl('/symptom-checker');
            }, 1000);
          }
          if (response.response.action === 'OPEN_PRAKRITI_QUIZ') {
            setTimeout(() => {
              this.router.navigateByUrl('/ayurveda/prakriti');
            }, 1000);
          }
          if (response.response.action === 'OPEN_BOOKING') {
            setTimeout(() => {
              this.router.navigateByUrl('/find-doctors');
            }, 1000);
          }
        },
        error: (error) => {
          this.isTyping = false;
          this.isWaitingForResponse = false;
          console.error('Action error:', error);
        }
      });
      this.activeSubscriptions.push(sub);
    } catch (error) {
      this.isTyping = false;
      this.isWaitingForResponse = false;
      console.error('Action error:', error);
    }
  }

  addUserMessage(text: string) {
    this.messages.push({
      sender: 'user',
      text: text?.trim(),
      timestamp: new Date()
    });
    this.shouldScrollToBottom = true;
  }

  addBotMessage(data: any) {
    const rawText = data.message || data.text || '';
    this.messages.push({
      sender: 'bot',
      text: typeof rawText === 'string' ? rawText.trim() : rawText,
      type: data.type,
      options: data.options,
      data: data.data,
      timestamp: new Date(),
      action: data.action,
      upgradeMessage: data.upgradeMessage,
      price: data.price
    });
    this.shouldScrollToBottom = true;

    if (!this.isOpen) {
      this.unreadCount++;
    }
  }

  showPricing() {
    // Navigate to pricing page
    this.router.navigateByUrl('/pricing');
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopResponse() {
    // Prevent duplicate stop messages
    if (!this.isWaitingForResponse && !this.isTyping) {
      return;
    }

    // Cancel all active HTTP requests
    this.cancelAllRequests();

    // Reset loading states
    this.isTyping = false;
    this.isWaitingForResponse = false;

    // Add a message indicating the request was stopped
    this.addBotMessage({
      text: 'Request stopped. How else can I help you?',
      type: 'text'
    });
  }

  private cancelAllRequests() {
    this.activeSubscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.activeSubscriptions = [];
  }

  // Session Management Methods
  loadChatSessions() {
    this.loadingSessions = true;
    this.chatbotService.getSessions().subscribe({
      next: (response) => {
        if (response.success) {
          // Filter out empty sessions (0 messages)
          this.chatSessions = response.sessions.filter((s: any) => s.messageCount > 0);

          // If we have sessions and nothing is started, resume the latest one
          if (this.chatSessions.length > 0 && !this.hasStartedSession) {
            this.switchToSession(this.chatSessions[0]);
          }
        }
        this.loadingSessions = false;
      },
      error: (error) => {
        console.error('Failed to load sessions:', error);
        this.loadingSessions = false;
      }
    });
  }

  startNewChat() {
    this.isTyping = true;
    this.chatbotService.createNewSession().subscribe({
      next: (response) => {
        if (response.success) {
          this.currentSessionId = response.sessionId;
          this.sessionId = response.sessionId;
          this.messages = [];
          this.hasStartedSession = true;
          this.showHistory = false; // Close sidebar
          this.shouldScrollToBottom = true;

          // Ensure chat is open
          if (!this.isOpen) {
            this.isOpen = true;
          }
        }
        this.isTyping = false;
      },
      error: (error) => {
        console.error('Failed to create new session:', error);
        this.isTyping = false;
      }
    });
  }

  switchToSession(session: ChatSession) {
    if (session.sessionId === this.currentSessionId) {
      this.showHistory = false;
      return;
    }

    this.isTyping = true;
    this.chatbotService.getSessionMessages(session.sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentSessionId = session.sessionId;
          this.sessionId = session.sessionId;
          this.messages = response.messages.map((m: any) => {
            let text = m.text;
            let type = m.type;
            let options = m.options;
            let data = m.data;

            if (m.sender === 'bot') {
              try {
                if (typeof text === 'string' && text.trim().startsWith('{')) {
                  const parsed = JSON.parse(text);
                  // Only use parsed values if they exist, but don't fallback to text if it's a valid rich message
                  if (parsed.type || parsed.data) {
                    text = parsed.message || ''; // Allow empty string for message if data exists
                    type = parsed.type || type;
                    options = parsed.options || options;
                    data = parsed.data || data;
                  } else {
                    // Standard fallback
                    text = parsed.message || parsed.text || text;
                  }
                }
              } catch (e) {
                // Not valid JSON or parsing failed, keep as is
              }
            } else if (m.sender === 'user' && typeof text === 'string' && text.startsWith('action:')) {
              // Map common actions to labels for display
              const actionLabels: { [key: string]: string } = {
                'CHECK_SYMPTOMS': '🔍 Check Symptoms',
                'BOOK_APPOINTMENT': '📅 Book Appointment',
                'PRAKRITI_QUIZ': '🧘 Take Prakriti Quiz',
                'EMERGENCY': '🚨 Emergency Help'
              };
              const actionName = text.replace('action:', '');
              text = actionLabels[actionName] || actionName.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
            }

            return {
              sender: m.sender,
              text: typeof text === 'string' ? text.trim() : text,
              type: type,
              options: options,
              data: data,
              timestamp: new Date(m.timestamp || m.created_at)
            };
          });
          this.hasStartedSession = true;
          this.showHistory = false; // Close sidebar on mobile
          this.shouldScrollToBottom = true;
        }
        this.isTyping = false;
      },
      error: (error) => {
        console.error('Failed to load session messages:', error);
        this.isTyping = false;
      }
    });
  }

  private deleteSessionById(sessionId: string) {
    this.chatbotService.deleteSession(sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChatSessions(); // Refresh list
          if (sessionId === this.currentSessionId) {
            // If deleting current session, reset state and start a new one
            this.currentSessionId = null;
            this.sessionId = undefined;
            this.hasStartedSession = false;
            this.messages = [];
            this.startNewChat();
          }
        }
      },
      error: (error) => {
        console.error('Failed to delete session:', error);
      }
    });
  }

  get filteredSessions() {
    if (!this.historySearchQuery.trim()) {
      return this.chatSessions;
    }
    const query = this.historySearchQuery.toLowerCase();
    return this.chatSessions.filter(s =>
      s.firstMessage.toLowerCase().includes(query)
    );
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
    if (this.showHistory && this.chatSessions.length === 0) {
      this.loadChatSessions();
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  toggleSessionMenu(index: number, event: Event) {
    event.stopPropagation();
    this.activeSessionMenu = this.activeSessionMenu === index ? null : index;
  }

  pinSession(session: ChatSession, event: Event) {
    event.stopPropagation();
    this.activeSessionMenu = null;

    const newPinnedState = !session.pinned;
    this.chatbotService.updateSession(session.sessionId, { pinned: newPinnedState }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChatSessions(); // Refresh list to show new order
        }
      },
      error: (error) => {
        console.error('Failed to pin session:', error);
      }
    });
  }

  renameSession(session: ChatSession, event: Event) {
    event.stopPropagation();
    this.activeSessionMenu = null;
    this.sessionToRename = session;
    this.renameInput = session.firstMessage;
  }

  saveRename() {
    if (this.sessionToRename && this.renameInput.trim() && this.renameInput !== this.sessionToRename.firstMessage) {
      this.chatbotService.updateSession(this.sessionToRename.sessionId, { customName: this.renameInput.trim() }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadChatSessions();
          }
        },
        error: (error) => {
          console.error('Failed to rename session:', error);
        }
      });
    }
    this.sessionToRename = null;
  }

  cancelRename() {
    this.sessionToRename = null;
  }

  confirmDeleteSession(session: ChatSession, event: Event) {
    event.stopPropagation();
    this.activeSessionMenu = null;
    this.sessionToDelete = session;
  }

  cancelDelete() {
    this.sessionToDelete = null;
  }

  executeDelete() {
    if (this.sessionToDelete) {
      this.deleteSessionById(this.sessionToDelete.sessionId);
      this.sessionToDelete = null;
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    // Intercept clicks on links generated inside the chat (e.g. from innerHTML)
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');

    if (anchor) {
      const href = anchor.getAttribute('href');
      // If it's an internal link
      if (href && href.startsWith('/')) {
        event.preventDefault();
        this.isOpen = false; // Close chat on navigation
        this.router.navigateByUrl(href);
        return;
      }
    }

    // Default outside click logic
    // Don't close if modals are active or if clicking inside component
    if (this.sessionToDelete || this.sessionToRename || this.showClearAllModal) {
      return;
    }

    // Logic for closing when clicking outside is already handled by document:click listener below
    // However, if we click INSIDE the chat, we don't want to close it.
    // The document:click listener checks "if !contains(target)", so clicking inside is fine.
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // ... existing logic ...
    // If the chat is open and the click target is NOT inside this component
    if (this.isOpen && !this.el.nativeElement.contains(event.target)) {
      // Check if we are not clicking on the toggle button (which might be outside if detached, but usually not)
      // Actually, toggle button is inside the component template, so el.contains should be true.
      // But let's be safe.
      this.isOpen = false;
      this.unreadCount = 0;
    }
    this.activeSessionMenu = null;
  }

  // Navigation helper methods for AI-generated links
  navigateToFindDoctors(medicineType?: string) {
    this.isOpen = false;
    this.router.navigate(['/find-doctors']);
  }

  navigateToMedicines() {
    this.isOpen = false;
    this.router.navigate(['/medicines']);
  }

  confirmClearAll() {
    this.showClearAllModal = true;
    this.activeSessionMenu = null;
  }

  cancelClearAll() {
    this.showClearAllModal = false;
  }

  executeClearAll() {
    this.isClearingAll = true;
    this.chatbotService.clearAllHistory().subscribe({
      next: (response) => {
        if (response.success) {
          // Clear everything
          this.messages = [];
          this.chatSessions = [];
          this.sessionId = undefined;
          this.currentSessionId = null;
          this.hasStartedSession = false;
          this.showClearAllModal = false;

          // Start a fresh one
          this.startNewChat();
        }
        this.isClearingAll = false;
      },
      error: (error) => {
        console.error('Failed to clear history:', error);
        this.isClearingAll = false;
      }
    });
  }

  expandedMessages: Set<number> = new Set();

  toggleMessage(index: number) {
    if (this.expandedMessages.has(index)) {
      this.expandedMessages.delete(index);
    } else {
      this.expandedMessages.add(index);
    }
  }

  formatMessage(text: string, index?: number): SafeHtml {
    if (!text) return '';

    // --- TRUNCATION LOGIC (RESTORED) ---
    const maxLength = 300;
    const isExpanded = index !== undefined && this.expandedMessages.has(index);
    let displayText = text;

    if (text.length > maxLength && index !== undefined && !isExpanded) {
      displayText = text.substring(0, maxLength) + '...';
    }
    // -----------------------------------

    let formatted = displayText;

    // --- SAFETY STEP: Extract Code Blocks & Existing Links ---
    const placeholders: string[] = [];

    // 1. Hide Code Blocks
    formatted = formatted.replace(/(`+)([\s\S]*?)\1/g, (match) => {
      placeholders.push(match);
      return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });

    // 2. Hide Markdown Links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
      const htmlLink = match.replace(/\[((?:[^\[\]]|\[[^\[\]]*\])*)\]\((.*?)\)/,
        '<a href="$2" class="text-emerald-600 font-medium hover:underline" target="_blank">$1</a>');
      placeholders.push(htmlLink);
      return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });

    // 3. Standard Formatting
    formatted = formatted.replace(/###\s+(.*)/g, '<h3 class="text-sm font-bold text-emerald-800 mt-2 mb-1">$1</h3>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-700 font-extrabold">$1</strong>');

    // Bullet points
    formatted = formatted.replace(/^[*|-]\s+(.*)/gm,
      '<div class="flex gap-2 items-start my-1.5 pl-2"><span class="text-emerald-500 mt-1">•</span><span>$1</span></div>'
    );
    // Numbered lists
    formatted = formatted.replace(/(?:^|\n)(\d+\.)\s+(.*?)(?=(?:\n\d+\.)|$)/gs,
      '<div class="flex gap-2 items-start my-1.5 pl-2"><span class="text-emerald-600 font-bold mt-0.5 text-xs min-w-[15px]">$1</span><span>$2</span></div>'
    );

    // 4. Keyword Auto-linking
    const keywords: { [key: string]: string } = {
      'yoga': '/ayurveda/yoga',
      'meditation': '/ayurveda/yoga',
      'prakriti': '/ayurveda/prakriti',
      'dosha': '/ayurveda/about',
      'medicines': '/medicines',
      'shop': '/medicines',
      'doctors': '/find-doctors',
      'hospital': '/hospitals',
      'ambulance': '/emergency',
      'symptom checker': '/symptom-checker'
    };

    Object.keys(keywords).forEach(key => {
      const regex = new RegExp(`\\b(${key})\\b`, 'gi');
      formatted = formatted.replace(regex, `<a href="${keywords[key]}" class="text-emerald-600 font-bold underline decoration-emerald-300 hover:text-emerald-800 transition-colors">$1</a>`);
    });

    // 5. Restore Placeholders
    formatted = formatted.replace(/__PLACEHOLDER_(\d+)__/g, (match, id) => {
      return placeholders[parseInt(id)];
    });

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  navigateToFeature(link: string) {
    this.isOpen = false;
    this.router.navigateByUrl(link);
  }

  logout() {
    this.authService.logout();
    this.isOpen = false;
  }
}
