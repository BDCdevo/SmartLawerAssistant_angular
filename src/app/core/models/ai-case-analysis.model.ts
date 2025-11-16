// AI Case Analysis Models and DTOs

export interface CaseAnalysisRequestDto {
  caseId?: number;
  documentId?: number;
  rawText?: string;
}

export interface CaseAnalysisResponse {
  success: boolean;
  message?: string;
  data?: CaseAnalysisResult;
}

export interface CaseAnalysisResult {
  id?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  legalReferences?: string[];
  riskAssessment?: RiskAssessment;
  nextSteps?: string[];
  estimatedDuration?: string;
  estimatedCost?: string;
  analysisDate?: Date;
  modelUsed?: string;
  confidence?: number;
  pleaFull?: string;
  rawResponse?: string;
  timestamp?: Date;
}

export interface RiskAssessment {
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  score: number;
  factors: string[];
}

export interface CompletionRequestDto {
  content: string;
}

export interface CompletionResponse {
  success: boolean;
  response?: string;
  modelUsed?: string;
  tokensUsed?: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isDefault?: boolean;
  isAvailable?: boolean;
}

export interface SetDefaultModelRequest {
  model: string;
}

export interface CurrentModelResponse {
  model: string;
  provider?: string;
}

export enum AnalysisType {
  CASE = 'case',
  DOCUMENT = 'document',
  TEXT = 'text',
  FILE = 'file'
}

export interface AnalysisHistoryItem {
  id: number;
  type: AnalysisType;
  caseId?: number;
  documentId?: number;
  summary: string;
  createdAt: Date;
  modelUsed: string;
}
