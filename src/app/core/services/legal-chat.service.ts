import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LegalChatRequest, LegalChatResponse } from '../models/legal-chat.model';

/**
 * Legal Chat Service
 * Simple chat service without predefined system prompts
 * Sends only user content to AI
 */
@Injectable({
  providedIn: 'root'
})
export class LegalChatService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/AI/Model/Chating`;

  /**
   * Send user message to AI
   * No system prompt - just user content
   * @param content User's legal question
   * @returns Observable<LegalChatResponse>
   */
  sendMessage(content: string): Observable<LegalChatResponse> {
    const request: LegalChatRequest = {
      content: content.trim()
    };

    return this.http.post<LegalChatResponse>(this.apiUrl, request);
  }

  /**
   * Extract assistant message content from API response
   * @param response API response
   * @returns string content or null
   */
  extractMessageContent(response: LegalChatResponse): string | null {
    try {
      if (response.success && response.data?.choices?.length > 0) {
        return response.data.choices[0].message.content;
      }
      return null;
    } catch (error) {
      console.error('Error extracting message content:', error);
      return null;
    }
  }

  /**
   * Get model name from response
   * @param response API response
   * @returns string model name or null
   */
  getModelName(response: LegalChatResponse): string | null {
    return response.data?.model || null;
  }

  /**
   * Get token usage from response
   * @param response API response
   * @returns usage object or null
   */
  getUsage(response: LegalChatResponse) {
    return response.data?.usage || null;
  }
}
