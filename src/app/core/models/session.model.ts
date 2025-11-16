export interface Session {
  id: number;
  caseId: number;
  courtId?: number;
  title?: string;
  startsAtUtc: string;
  endsAtUtc?: string;
  room?: string;
  judgeName?: string;
  status?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;

  // Relations
  case?: {
    id: number;
    number?: string;
    year?: number;
    circuit?: string;
    specialty?: string;
    client?: {
      id: number;
      fullName: string;
    };
  };
  court?: {
    id: number;
    nameAr?: string;
    nameEn?: string;
  };
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

export interface UpdateSessionDto {
  id: number;
  courtId?: number;
  title?: string;
  startsAtUtc?: string;
  endsAtUtc?: string;
  room?: string;
  judgeName?: string;
  status?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SessionStatus {
  value: string;
  label: string;
  color: string;
}

export const SESSION_STATUSES: SessionStatus[] = [
  { value: 'scheduled', label: 'مجدولة', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'جارية', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'مكتملة', color: 'bg-green-100 text-green-800' },
  { value: 'postponed', label: 'مؤجلة', color: 'bg-orange-100 text-orange-800' },
  { value: 'cancelled', label: 'ملغاة', color: 'bg-red-100 text-red-800' }
];
