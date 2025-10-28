export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  clientId: string;
  lawyerId: string;
  category: CaseCategory;
  courtName?: string;
  nextHearingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  documents?: Document[];
  notes?: CaseNote[];
}

export enum CaseStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum CaseCategory {
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  FAMILY = 'family',
  CORPORATE = 'corporate',
  REAL_ESTATE = 'real_estate',
  LABOR = 'labor',
  OTHER = 'other'
}

export interface CaseNote {
  id: string;
  caseId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

export interface CreateCaseRequest {
  title: string;
  description: string;
  clientId: string;
  category: CaseCategory;
  priority: CasePriority;
  courtName?: string;
  nextHearingDate?: Date;
}
