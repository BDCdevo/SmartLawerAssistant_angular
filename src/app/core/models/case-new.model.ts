// API-based Case Models
export interface CaseDto {
  id: number;
  number: string;
  year: number;
  circuit?: string;
  specialty?: string;
  status: string;
  clientId: number;
  client?: ClientDto;
  courtId?: number;
  court?: CourtDto;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
}

export interface CreateCaseDto {
  number: string;
  year: number;
  circuit?: string;
  specialty?: string;
  status?: string;
  clientId: number;
  courtId?: number;
  notes?: string;
}

export interface UpdateCaseDto extends CreateCaseDto {
  id: number;
}

export interface CaseSearchDto {
  q?: string;
  clientId?: number;
  courtId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ClientDto {
  id: number;
  fullName: string;
  nationalId?: number;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  isActive: boolean;
}

export interface CreateClientDto {
  fullName: string;
  nationalId?: number;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
}

export interface UpdateClientDto extends CreateClientDto {
  id: number;
  isActive: boolean;
}

export interface CourtDto {
  id: number;
  nameAr: string;
  nameEn?: string;
  courtTypeId?: number;
  governorate?: string;
  city?: string;
  addressLine?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface CreateCourtDto {
  nameAr: string;
  nameEn?: string;
  courtTypeId?: number;
  governorate?: string;
  city?: string;
  addressLine?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface UpdateCourtDto extends CreateCourtDto {
  id: number;
}

export interface CourtSearchDto {
  q?: string;
  governorate?: string;
  city?: string;
  courtTypeId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SessionDto {
  id: number;
  caseId: number;
  case?: CaseDto;
  courtId?: number;
  court?: CourtDto;
  title?: string;
  startsAtUtc: string;
  endsAtUtc?: string;
  room?: string;
  judgeName?: string;
  status?: string;
  notes?: string;
  isActive: boolean;
}

export interface CreateSessionDto {
  caseId: number;
  courtId?: number;
  title?: string;
  startsAtUtc: string;
  endsAtUtc?: string;
  room?: string;
  judgeName?: string;
  status?: string;
  notes?: string;
}

export interface UpdateSessionDto extends CreateSessionDto {
  id: number;
  isActive?: boolean;
}

export interface SessionSearchDto {
  caseId?: number;
  courtId?: number;
  fromUtc?: string;
  toUtc?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface DocumentDto {
  id: number;
  caseId: number;
  case?: CaseDto;
  title: string;
  category?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  // API response fields
  originalFileName?: string;
  storedFileName?: string;
  storagePath?: string;
  sizeBytes?: number;
  uploadedByUserId?: number;
  createdAt?: string;
  analysisStatus?: string;
}


export interface DocumentSearchDto {
  q?: string;
  caseId?: number;
  clientId?: number;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface CaseDocumentSearchDto {
  caseId: number;
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationDto {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface ReportDto {
  casesSummary?: CasesSummaryDto;
  sessionsUpcoming?: SessionDto[];
  lawyersWorkload?: LawyerWorkloadDto[];
  clientsSummary?: ClientsSummaryDto;
  dashboardKpis?: DashboardKpisDto;
}

export interface CasesSummaryDto {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  byStatus: { [key: string]: number };
}

export interface LawyerWorkloadDto {
  lawyerId: string;
  lawyerName: string;
  activeCases: number;
  upcomingSessions: number;
}

export interface ClientsSummaryDto {
  total: number;
  active: number;
  withActiveCases: number;
}

export interface DashboardKpisDto {
  totalCases: number;
  activeCases: number;
  closedCases: number;
  totalClients: number;
  upcomingSessions: number;
  pendingDocuments: number;
  recentActivity: ActivityDto[];
}

export interface ActivityDto {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}
