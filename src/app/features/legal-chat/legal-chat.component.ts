import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { LegalChatService } from '../../core/services/legal-chat.service';
import { AiCaseAnalysisService } from '../../core/services/ai-case-analysis.service';
import { ChatMessageDisplay } from '../../core/models/legal-chat.model';
import { AIModel } from '../../core/models';
import { Nl2brPipe } from '../../core/pipes/nl2br.pipe';

/**
 * Legal Chat Component
 * Chat interface with AI model selection
 */
@Component({
  selector: 'app-legal-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, Nl2brPipe],
  templateUrl: './legal-chat.component.html',
  styleUrls: ['./legal-chat.component.scss']
})
export class LegalChatComponent implements OnInit {
  private chatService = inject(LegalChatService);
  private aiService = inject(AiCaseAnalysisService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // State
  messages = signal<ChatMessageDisplay[]>([]);
  userInput = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Model management
  availableModels = signal<AIModel[]>([]);
  currentModel = signal<string>('');
  selectedModelForChange = signal<string>('');
  isChangingModel = signal<boolean>(false);

  ngOnInit(): void {
    this.loadAvailableModels();
    this.loadCurrentModel();
  }

  /**
   * Load available AI models
   */
  private loadAvailableModels(): void {
    this.aiService.getAvailableModels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (models) => {
          this.availableModels.set(models || []);
        },
        error: () => {
          this.toastr.error('فشل تحميل النماذج المتاحة', 'خطأ');
        }
      });
  }

  /**
   * Load current default model
   */
  private loadCurrentModel(): void {
    this.aiService.getCurrentModel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (model) => {
          if (model) {
            this.currentModel.set(model.model);
            this.selectedModelForChange.set(model.model);
          }
        },
        error: () => {
          // Error handled by interceptor
        }
      });
  }

  /**
   * Change the default AI model
   */
  changeDefaultModel(): void {
    const newModel = this.selectedModelForChange();
    if (!newModel || newModel === this.currentModel()) {
      return;
    }

    this.isChangingModel.set(true);
    this.aiService.setDefaultModel(newModel)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isChangingModel.set(false);
          if (response.success) {
            this.currentModel.set(newModel);
            this.toastr.success('تم تغيير النموذج الافتراضي بنجاح', 'نجح');
          } else {
            this.toastr.error(response.message || 'فشل تغيير النموذج', 'خطأ');
          }
        },
        error: () => {
          this.isChangingModel.set(false);
          this.toastr.error('حدث خطأ أثناء تغيير النموذج', 'خطأ');
        }
      });
  }

  /**
   * Send user message to AI
   */
  sendMessage(): void {
    const content = this.userInput().trim();

    // Validate input
    if (!content) {
      return;
    }

    // Validate legal question (simple validation)
    if (!this.isLegalQuestion(content)) {
      this.error.set('من فضلك، اسأل أسئلة متعلقة بالقانون والمحاماة فقط.');
      setTimeout(() => this.error.set(null), 5000);
      return;
    }

    // Clear error
    this.error.set(null);

    // Add user message to chat
    const userMessage: ChatMessageDisplay = {
      id: this.generateId(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMessage]);

    // Add loading placeholder for assistant
    const loadingMessage: ChatMessageDisplay = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    this.messages.update(msgs => [...msgs, loadingMessage]);

    // Clear input and set loading state
    this.userInput.set('');
    this.isLoading.set(true);

    // Send request to API
    this.chatService.sendMessage(content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          // Extract assistant message content
          const assistantContent = this.chatService.extractMessageContent(response);
          const modelName = this.chatService.getModelName(response);

          if (assistantContent) {
            // Update loading message with actual response
            this.messages.update(msgs => {
              const updated = [...msgs];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: assistantContent,
                model: modelName || undefined,
                isLoading: false
              };
              return updated;
            });

            // Scroll to bottom after message is added
            this.scrollToBottom();
          } else {
            // Handle empty response
            this.handleError('لم يتم الحصول على رد من الخادم.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error sending message:', err);

          // Determine error message
          let errorMessage = 'حدث خطأ في الخادم. حاول لاحقًا.';
          if (err.status === 401) {
            errorMessage = 'انتهت صلاحية الجلسة. من فضلك سجل دخولك مرة أخرى.';
          } else if (err.status === 0) {
            errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت.';
          }

          this.handleError(errorMessage);
        }
      });
  }

  /**
   * Handle errors by updating the loading message with error state
   */
  private handleError(errorMessage: string): void {
    this.messages.update(msgs => {
      const updated = [...msgs];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = {
        ...updated[lastIndex],
        content: errorMessage,
        isLoading: false,
        error: true
      };
      return updated;
    });
  }

  /**
   * Simple validation: Check if question is legal-related
   */
  private isLegalQuestion(content: string): boolean {
    const legalKeywords = [
      'قانون', 'محكمة', 'قاضي', 'محامي', 'دعوى', 'جنحة', 'جناية',
      'عقد', 'نزاع', 'حق', 'مادة', 'دستور', 'تشريع', 'حكم', 'استئناف',
      'نقض', 'تحقيق', 'شهادة', 'محضر', 'قضية', 'طعن', 'تقاضي', 'قضاء',
      'law', 'legal', 'court', 'lawyer', 'attorney', 'case', 'contract',
      'مسئولية', 'تعويض', 'عقوبة', 'مخالفة', 'جريمة', 'متهم', 'مدعي'
    ];

    const lowerContent = content.toLowerCase();
    return legalKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Clear chat history
   */
  clearChat(): void {
    this.messages.set([]);
    this.error.set(null);
  }

  /**
   * Generate unique ID for messages
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Scroll chat to bottom
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
