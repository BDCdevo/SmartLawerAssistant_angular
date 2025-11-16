import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

// ApiResponse structure from backend
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  code: string | null;
  data: T | null;
  errors: ApiError[] | null;
  meta: any;
  traceId: string | null;
  timestamp: string;
  links: Record<string, string> | null;
}

export interface ApiError {
  code: string;
  message: string;
  field: string | null;
  details: Record<string, string[]> | null;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isDefault?: boolean;
  capabilities?: string[];
}

export interface CurrentModelResponse {
  currentModel: string;
  details: {
    redisKey?: string;
    redisValue?: string | null;
    inMemoryValue?: string | null;
    configDefault?: string;
    source?: string;
  };
}

export interface SetDefaultModelRequest {
  model: string; // Changed from modelId to model
}

export interface SetDefaultModelResponse {
  currentModel: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIModelService {
  private http = inject(HttpClient);
  private apiUrl = '/api/AI/Model';

  private currentModelSubject = new BehaviorSubject<string | null>(null);
  public currentModel$ = this.currentModelSubject.asObservable();

  /**
   * Get all available AI models
   * Returns ApiResponse with data as object from CLIProxyAPI
   */
  getModels(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/models`).pipe(
      map(response => {
        console.log('📦 Raw API response for models:', response);
        return response.data; // Extract data from ApiResponse wrapper
      })
    );
  }

  /**
   * Get current/default AI model
   * Returns ApiResponse with currentModel and details
   */
  getCurrentModel(): Observable<CurrentModelResponse> {
    return this.http.get<ApiResponse<CurrentModelResponse>>(`${this.apiUrl}/current-model`).pipe(
      map(response => {
        console.log('📦 Raw API response for current-model:', response);
        const data = response.data;
        if (data && data.currentModel) {
          this.currentModelSubject.next(data.currentModel);
        }
        return data!;
      })
    );
  }

  /**
   * Set default AI model
   * Request body: { model: string }
   * Response: ApiResponse with { currentModel: string }
   */
  setDefaultModel(modelName: string): Observable<SetDefaultModelResponse> {
    const request: SetDefaultModelRequest = { model: modelName };
    return this.http.put<ApiResponse<SetDefaultModelResponse>>(`${this.apiUrl}/setDefault-model`, request).pipe(
      map(response => {
        console.log('📦 Raw API response for setDefault-model:', response);
        if (response.data && response.data.currentModel) {
          this.currentModelSubject.next(response.data.currentModel);
        }
        return response.data!;
      }),
      tap(() => {
        // Refresh current model after setting default
        this.getCurrentModel().subscribe();
      })
    );
  }
}
