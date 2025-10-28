import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ChatSession, ChatMessage, AIChatRequest, AIChatResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AIAssistantService {
  private http = inject(HttpClient);
  private apiUrl = '/api/ai'; // Update with your API URL

  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.apiUrl}/sessions`);
  }

  getSessionById(id: string): Observable<ChatSession> {
    return this.http.get<ChatSession>(`${this.apiUrl}/sessions/${id}`).pipe(
      tap(session => this.currentSessionSubject.next(session))
    );
  }

  createSession(title: string = 'New Conversation'): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/sessions`, { title }).pipe(
      tap(session => this.currentSessionSubject.next(session))
    );
  }

  sendMessage(request: AIChatRequest): Observable<AIChatResponse> {
    return this.http.post<AIChatResponse>(`${this.apiUrl}/chat`, request);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`).pipe(
      tap(() => {
        if (this.currentSessionSubject.value?.id === id) {
          this.currentSessionSubject.next(null);
        }
      })
    );
  }

  analyzeDocument(documentId: string, query: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze-document`, {
      documentId,
      query
    });
  }

  getCaseSummary(caseId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/case-summary/${caseId}`, {
      responseType: 'text'
    });
  }

  generateLegalDraft(params: {
    type: string;
    context: any;
  }): Observable<string> {
    return this.http.post(`${this.apiUrl}/generate-draft`, params, {
      responseType: 'text'
    });
  }
}
