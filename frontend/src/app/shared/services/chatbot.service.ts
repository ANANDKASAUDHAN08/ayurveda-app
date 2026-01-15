import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

interface ChatMessage {
  sessionId: string;
  message: string;
}

interface ChatResponse {
  success: boolean;
  response: any;
  remaining?: number | string;
}

interface SessionResponse {
  success: boolean;
  sessionId: string;
  welcomeMessage: string;
  tier: string;
  remaining: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;

  constructor(private http: HttpClient) { }

  /**
   * Start a new chat session
   */
  startSession(): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.apiUrl}/start`, {});
  }

  /**
   * Send message to chatbot
   */
  sendMessage(sessionId: string, message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/message`, {
      sessionId,
      message
    });
  }

  /**
   * Get chat history
   */
  getHistory(limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/history?limit=${limit}`);
  }

  /**
   * End chat session
   */
  endSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/end`, { sessionId });
  }

  /**
   * Get all chat sessions for user
   */
  getSessions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions`);
  }

  /**
   * Create a new chat session
   */
  createNewSession(): Observable<{ success: boolean; sessionId: string }> {
    return this.http.post<{ success: boolean; sessionId: string }>(`${this.apiUrl}/sessions/new`, {});
  }

  /**
   * Get messages for a specific session
   */
  getSessionMessages(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions/${sessionId}/messages`);
  }

  /**
   * Update a chat session (pin/rename)
   */
  updateSession(sessionId: string, updates: { pinned?: boolean; customName?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/sessions/${sessionId}`, updates);
  }

  /**
   * Delete a chat session
   */
  deleteSession(sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions/${sessionId}`);
  }

  /**
   * Delete all chat sessions for the user
   */
  clearAllHistory(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions`);
  }
}
