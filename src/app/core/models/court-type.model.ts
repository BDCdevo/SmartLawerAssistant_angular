// Court Type Models

export interface CourtType {
  id: number;
  nameAr: string;
  nameEn?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface CreateCourtTypeDto {
  nameAr: string;
  nameEn?: string;
  isActive: boolean;
}

export interface UpdateCourtTypeDto {
  id: number;
  nameAr: string;
  nameEn?: string;
  isActive: boolean;
}
