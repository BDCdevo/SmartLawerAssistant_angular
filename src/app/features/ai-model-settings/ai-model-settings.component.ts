import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AIModelService, AIModel, CurrentModelResponse } from '../../core/services/ai-model.service';

@Component({
  selector: 'app-ai-model-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-model-settings.component.html',
  styleUrl: './ai-model-settings.component.scss'
})
export class AIModelSettingsComponent implements OnInit {
  private aiModelService = inject(AIModelService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  // State signals
  models = signal<AIModel[]>([]);
  currentModelName = signal<string | null>(null);
  currentModelDetails = signal<any>(null);
  currentModel = signal<AIModel | null>(null); // For template usage
  loading = signal(false);
  selectedModelId = signal<string | null>(null);
  isTestMode = signal(false); // Track if using test data

  ngOnInit() {
    console.log('🎯 AI Model Settings Component initialized');

    // Load test models immediately for demo/testing
    // This ensures the screen is never empty
    this.addTestModels();

    // Also try to load from API in background
    // If successful, it will replace test data
    this.loadModelsInBackground();
  }

  // Load models in background without affecting UI
  loadModelsInBackground() {
    this.aiModelService.getModels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          console.log('📦 Background API check - Models available:', data);

          // Process models from API
          let rawModels: any[] = [];

          // Check if data has nested 'data' property (OpenAI format)
          if (data && data.data && Array.isArray(data.data)) {
            rawModels = data.data;
          } else if (Array.isArray(data)) {
            rawModels = data;
          } else if (data && Array.isArray(data.models)) {
            rawModels = data.models;
          } else if (data && data.$values && Array.isArray(data.$values)) {
            rawModels = data.$values;
          } else if (data && typeof data === 'object') {
            rawModels = Object.values(data).filter((item: any) =>
              item && typeof item === 'object' && 'id' in item
            );
          }

          // Transform API models to AIModel format
          const models: AIModel[] = rawModels.map(m => this.transformApiModel(m));

          console.log(`📊 Total models after transformation: ${models.length}`);
          console.log('📋 All transformed models:', models);

          // Only replace test data if we got real models
          if (models.length > 0) {
            console.log('✅ Replacing test data with API data');
            this.isTestMode.set(false);
            this.models.set(models);
            console.log('📊 Models signal updated, current value:', this.models());
            this.updateCurrentModelObject();
            this.cdr.detectChanges();

            // Also load current model from API
            this.loadCurrentModel();
          }
        },
        error: (error) => {
          console.log('ℹ️ API not available, using test data:', error.status);
          // Keep test data, no error message needed
        }
      });
  }

  // Transform API model format to AIModel
  transformApiModel(apiModel: any): AIModel {
    console.log('🔄 Transforming API model:', apiModel);

    // Generate a friendly name from ID
    const name = this.generateModelName(apiModel.id);

    // Map owned_by to provider
    const provider = this.capitalizeProvider(apiModel.owned_by || 'Unknown');

    const transformed = {
      id: apiModel.id,
      name: name,
      provider: provider,
      description: this.generateDescription(apiModel.id, provider),
      capabilities: this.generateCapabilities(apiModel.id)
    };

    console.log('✅ Transformed model:', transformed);
    return transformed;
  }

  // Generate friendly model name from ID
  generateModelName(id: string): string {
    // Examples:
    // "claude-sonnet-4-5-20250929" -> "Claude Sonnet 4.5"
    // "gemini-2.5-flash" -> "Gemini 2.5 Flash"

    // Remove date suffix (8 digits at end)
    let name = id.replace(/-\d{8}$/, '');

    // Split by dash and capitalize
    const parts = name.split('-');
    const formatted = parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return formatted;
  }

  // Capitalize provider name
  capitalizeProvider(provider: string): string {
    if (!provider) return 'Unknown';
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }

  // Generate description based on model ID
  generateDescription(id: string, provider: string): string {
    const lower = id.toLowerCase();

    if (lower.includes('sonnet')) {
      return `نموذج متوازن من ${provider} يجمع بين الذكاء والسرعة`;
    } else if (lower.includes('opus')) {
      return `النموذج الأقوى من ${provider} للمهام المعقدة`;
    } else if (lower.includes('haiku')) {
      return `نموذج سريع وفعال من ${provider} للمهام اليومية`;
    } else if (lower.includes('flash')) {
      return `نموذج سريع ومتطور من ${provider}`;
    } else if (lower.includes('pro')) {
      return `نموذج احترافي بقدرات متقدمة من ${provider}`;
    }

    return `نموذج ذكاء اصطناعي من ${provider}`;
  }

  // Generate capabilities based on model ID
  generateCapabilities(id: string): string[] {
    const lower = id.toLowerCase();
    const caps: string[] = [];

    if (lower.includes('opus') || lower.includes('pro')) {
      caps.push('تحليل متقدم', 'برمجة', 'كتابة إبداعية');
    } else if (lower.includes('sonnet')) {
      caps.push('نصوص', 'محادثات', 'تحليل', 'برمجة');
    } else if (lower.includes('haiku') || lower.includes('flash') || lower.includes('lite')) {
      caps.push('محادثات', 'نصوص', 'استجابة سريعة');
    } else {
      caps.push('نصوص', 'محادثات', 'تحليل');
    }

    if (lower.includes('image')) {
      caps.push('معالجة صور');
    }

    return caps;
  }

  loadModels() {
    this.loading.set(true);
    // Disable test mode when loading from API
    this.isTestMode.set(false);

    this.aiModelService.getModels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          console.log('📦 Models data (after extraction):', data);

          // Process models from API
          let rawModels: any[] = [];

          // Check if data has nested 'data' property (OpenAI format)
          if (data && data.data && Array.isArray(data.data)) {
            rawModels = data.data;
          } else if (Array.isArray(data)) {
            rawModels = data;
          } else if (data && Array.isArray(data.models)) {
            rawModels = data.models;
          } else if (data && data.$values && Array.isArray(data.$values)) {
            rawModels = data.$values;
          } else if (data && typeof data === 'object') {
            console.log('⚠️ Converting object to models array');
            rawModels = Object.values(data).filter((item: any) =>
              item && typeof item === 'object' && 'id' in item
            );
          } else {
            console.warn('⚠️ Unexpected models data format:', data);
            rawModels = [];
          }

          // Transform API models to AIModel format
          const models: AIModel[] = rawModels.map(m => this.transformApiModel(m));

          console.log(`📊 Total models after transformation (loadModels): ${models.length}`);
          console.log('✅ Processed models:', models);
          this.models.set(models);
          console.log('📊 Models signal updated (loadModels), current value:', this.models());
          this.updateCurrentModelObject();
          this.cdr.detectChanges();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading models:', error);
          this.toastr.error('فشل في تحميل قائمة النماذج', 'خطأ');
          this.models.set([]);
          this.loading.set(false);
        }
      });
  }

  loadCurrentModel() {
    this.aiModelService.getCurrentModel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: CurrentModelResponse) => {
          console.log('📦 Current model data (after extraction):', data);

          if (data && data.currentModel) {
            this.currentModelName.set(data.currentModel);
            this.currentModelDetails.set(data.details);
            this.selectedModelId.set(data.currentModel);
            this.updateCurrentModelObject(); // Update current model object

            console.log('✅ Current model set to:', data.currentModel);
            console.log('📋 Model details:', data.details);
          } else {
            console.warn('⚠️ No current model data available');
          }
        },
        error: (error) => {
          console.error('❌ Error loading current model:', error);
          this.toastr.warning('فشل في تحميل النموذج الحالي', 'تحذير');
        }
      });
  }

  selectModel(modelId: string) {
    this.selectedModelId.set(modelId);
  }

  setAsDefault() {
    const modelId = this.selectedModelId();
    if (!modelId) {
      this.toastr.warning('الرجاء اختيار نموذج أولاً', 'تحذير');
      return;
    }

    // Find the selected model for display
    const selectedModel = this.models().find(m => m.id === modelId);

    // If in test mode, update locally only
    if (this.isTestMode()) {
      console.log('🧪 Test Mode: Updating current model locally to:', modelId);
      this.currentModelName.set(modelId);
      this.updateCurrentModelObject();
      this.cdr.detectChanges();

      this.toastr.success(
        `تم تعيين "${selectedModel?.name || modelId}" كنموذج افتراضي بنجاح (وضع الاختبار)`,
        'نجح'
      );
      return;
    }

    // Real API call
    this.loading.set(true);
    this.aiModelService.setDefaultModel(modelId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('✅ Set default model response:', response);

          // Update local state immediately
          if (response.currentModel) {
            console.log('🔄 Updating current model to:', response.currentModel);
            this.currentModelName.set(response.currentModel);
            this.updateCurrentModelObject();
            this.cdr.detectChanges(); // Force change detection
          }

          this.toastr.success(
            `تم تعيين "${selectedModel?.name || response.currentModel}" كنموذج افتراضي بنجاح`,
            'نجح'
          );

          // Reload current model from API to confirm
          this.aiModelService.getCurrentModel()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (data) => {
                console.log('🔄 Reloaded current model:', data);
                if (data && data.currentModel) {
                  this.currentModelName.set(data.currentModel);
                  this.currentModelDetails.set(data.details);
                  this.updateCurrentModelObject();
                  this.cdr.detectChanges(); // Force change detection
                }
                this.loading.set(false);
              },
              error: (err) => {
                console.error('⚠️ Error reloading current model:', err);
                this.loading.set(false);
              }
            });
        },
        error: (error) => {
          console.error('❌ Error setting default model:', error);
          this.toastr.error('فشل في تعيين النموذج الافتراضي', 'خطأ');
          this.loading.set(false);
        }
      });
  }

  // Helper to check if a model is the current default
  isCurrentModel(modelId: string): boolean {
    const currentName = this.currentModelName();
    const isCurrentByName = currentName === modelId;
    const isCurrentByObject = this.getCurrentModelObject()?.id === modelId;
    return isCurrentByName || isCurrentByObject;
  }

  isSelectedModel(modelId: string): boolean {
    return this.selectedModelId() === modelId;
  }

  // Helper to get current model as AIModel object from the models list
  getCurrentModelObject(): AIModel | null {
    const currentName = this.currentModelName();
    if (!currentName) return null;

    // Try to find by exact id match
    let model = this.models().find(m => m.id === currentName);

    // If not found, try to find by name match
    if (!model) {
      model = this.models().find(m => m.name === currentName);
    }

    return model || null;
  }

  // Update currentModel signal based on currentModelName
  updateCurrentModelObject(): void {
    const currentName = this.currentModelName();
    console.log('🔄 Updating current model object for:', currentName);
    console.log('📚 Available models:', this.models().map(m => m.id));

    const modelObject = this.getCurrentModelObject();
    this.currentModel.set(modelObject);

    console.log('✅ Current model object updated:', modelObject);
    console.log('📊 State after update:', {
      currentModelName: this.currentModelName(),
      currentModel: this.currentModel(),
      selectedModelId: this.selectedModelId()
    });
  }

  getProviderIcon(provider: string | undefined | null): string {
    const icons: { [key: string]: string } = {
      'openai': '🤖',
      'anthropic': '🧠',
      'google': '🔍',
      'cohere': '💫',
      'huggingface': '🤗',
      'azure': '☁️',
      'aws': '🌐',
      'gemini': '💎',
      'default': '🔮'
    };

    if (!provider) {
      return icons['default'];
    }

    return icons[provider.toLowerCase()] || icons['default'];
  }

  // Test method to add sample models for development/testing
  addTestModels(): void {
    const testModels: AIModel[] = [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        description: 'نموذج سريع ومتطور من جوجل للمحادثات والتحليل',
        capabilities: ['نصوص', 'محادثات', 'تحليل', 'ترجمة']
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        description: 'أحدث إصدار من GPT-4 بأداء محسّن وسرعة أكبر',
        capabilities: ['نصوص', 'برمجة', 'تحليل', 'إبداع']
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: 'النموذج الأقوى من Anthropic للمهام المعقدة',
        capabilities: ['تحليل متقدم', 'برمجة', 'كتابة إبداعية']
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        description: 'نموذج احترافي بقدرات متقدمة للمهام المعقدة',
        capabilities: ['نصوص طويلة', 'تحليل عميق', 'سياق موسع']
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        description: 'نموذج سريع وفعال للمهام اليومية',
        capabilities: ['محادثات', 'نصوص', 'ترجمة']
      }
    ];

    console.log('🧪 Adding test models:', testModels);

    // Enable test mode
    this.isTestMode.set(true);

    this.models.set(testModels);
    this.loading.set(false);

    // Set first model as current for demonstration
    if (testModels.length > 0) {
      this.currentModelName.set(testModels[0].id);
      this.selectedModelId.set(testModels[0].id);
      this.updateCurrentModelObject();

      this.currentModelDetails.set({
        redisKey: 'settings:ai:defaultModel',
        redisValue: testModels[0].id,
        inMemoryValue: null,
        configDefault: 'gemini-1.5-flash',
        source: 'Test Data'
      });
    }

    this.cdr.detectChanges();

    // Only show toast if called manually (not on init)
    if (this.models().length > 0) {
      this.toastr.info('تم تحميل ' + testModels.length + ' نموذج تجريبي - يمكنك اختيار وتغيير النموذج الافتراضي', 'وضع التجربة');
    }
  }
}
