// Case Assignment Models

export interface CaseAssignment {
  id: number;
  caseId: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  notes?: string;
  assignedAt?: Date;
  isActive?: boolean;
  isDeleted?: boolean;
  // Case info
  caseNumber?: string;
  caseTitle?: string;
  caseStatus?: string;
}

// Search DTO
export interface CaseAssignmentSearchDto {
  caseId?: number;
  userId?: string;
  role?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// Assign DTO
export interface AssignCaseUserDto {
  caseId: number;
  userId: string;
  role?: string;
  notes?: string;
}

// Unassign DTO
export interface UnassignCaseUserDto {
  id?: number;
  caseId?: number;
  userId?: string;
  notes?: string;
}
