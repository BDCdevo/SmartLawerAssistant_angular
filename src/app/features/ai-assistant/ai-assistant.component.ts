import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIAssistantService } from '../../core/services/ai-assistant.service';
import { ChatMessage } from '../../core/models';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss'
})
export class AIAssistantComponent {
  private aiService = inject(AIAssistantService);

  messages = signal<ChatMessage[]>([]);
  newMessage = signal('');
  loading = signal(false);
  sessionId = signal<string | undefined>(undefined);

  ngOnInit() {
    // Initialize with a welcome message
    this.messages.set([{
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك القانوني الذكي. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }]);
  }

  sendMessage() {
    const message = this.newMessage().trim();
    if (!message || this.loading()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.newMessage.set('');
    this.loading.set(true);

    // Send to AI service
    this.aiService.sendMessage({
      message,
      sessionId: this.sessionId()
    }).subscribe({
      next: (response) => {
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        };
        this.messages.update(msgs => [...msgs, aiMessage]);
        this.sessionId.set(response.sessionId);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.loading.set(false);
      }
    });
  }
}
