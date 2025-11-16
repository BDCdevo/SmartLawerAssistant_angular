import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CaseAnalysisRequestDto,
  CaseAnalysisResponse,
  CompletionRequestDto,
  CompletionResponse,
  AIModel,
  SetDefaultModelRequest,
  CurrentModelResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AiCaseAnalysisService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/AI`;

  /**
   * تحليل قضية موجودة في النظام أو مستند أو نص
   */
  analyzeCase(request: CaseAnalysisRequestDto): Observable<CaseAnalysisResponse> {
    return this.http.post<any>(`${this.baseUrl}/AiCaseAnalysis/analyze`, request).pipe(
      map(response => ({
        success: response.success || response.isSuccess || true,
        message: response.message,
        data: response.data || response
      })),
      catchError(error => {
        console.error('Error analyzing case:', error);
        return of({
          success: false,
          message: error.error?.message || 'حدث خطأ أثناء تحليل القضية'
        });
      })
    );
  }

  /**
   * تحليل ملف خارجي (رفع ملف)
   */
  analyzeExternalFile(file: File): Observable<CaseAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.baseUrl}/AiCaseAnalysis/analyze-external`, formData).pipe(
      map(response => ({
        success: response.success || response.isSuccess || true,
        message: response.message,
        data: response.data || response
      })),
      catchError(error => {
        console.error('Error analyzing external file:', error);
        return of({
          success: false,
          message: error.error?.message || 'حدث خطأ أثناء تحليل الملف'
        });
      })
    );
  }

  /**
   * الحصول على قائمة النماذج المتاحة
   */
  getAvailableModels(): Observable<AIModel[]> {
    return this.http.get<any>(`${this.baseUrl}/Model/models`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        } else if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.models && Array.isArray(response.models)) {
          return response.models;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching AI models:', error);
        return of([]);
      })
    );
  }

  /**
   * الدردشة مع الـ AI
   */
  chat(request: CompletionRequestDto): Observable<CompletionResponse> {
    return this.http.post<any>(`${this.baseUrl}/Model/Chating`, request).pipe(
      map(response => ({
        success: response.success || response.isSuccess || true,
        response: response.response || response.data || response.message,
        modelUsed: response.modelUsed || response.model,
        tokensUsed: response.tokensUsed || response.tokens
      })),
      catchError(error => {
        console.error('Error in AI chat:', error);
        return of({
          success: false,
          response: error.error?.message || 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي'
        });
      })
    );
  }

  /**
   * تعيين النموذج الافتراضي
   */
  setDefaultModel(modelName: string): Observable<{ success: boolean; message?: string }> {
    const request: SetDefaultModelRequest = { model: modelName };
    return this.http.put<any>(`${this.baseUrl}/Model/setDefault-model`, request).pipe(
      map(response => ({
        success: response.success || response.isSuccess || true,
        message: response.message || 'تم تعيين النموذج الافتراضي بنجاح'
      })),
      catchError(error => {
        console.error('Error setting default model:', error);
        return of({
          success: false,
          message: error.error?.message || 'حدث خطأ أثناء تعيين النموذج'
        });
      })
    );
  }

  /**
   * الحصول على النموذج الحالي
   */
  getCurrentModel(): Observable<CurrentModelResponse | null> {
    return this.http.get<any>(`${this.baseUrl}/Model/current-model`).pipe(
      map(response => {
        if (response.model || response.data?.model) {
          return {
            model: response.model || response.data.model,
            provider: response.provider || response.data?.provider
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching current model:', error);
        return of(null);
      })
    );
  }

  /**
   * اختبار الاتصال بـ Redis (للمطورين فقط)
   */
  testRedis(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Model/test-redis`).pipe(
      catchError(error => {
        console.error('Error testing Redis:', error);
        return of({ success: false, error: error.message });
      })
    );
  }
}
