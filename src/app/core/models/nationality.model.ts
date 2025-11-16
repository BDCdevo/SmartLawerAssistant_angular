export interface Nationality {
  id: number;
  nameAr: string;
  nameEn?: string;
  flagEmoji?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface CreateNationalityDto {
  nameAr: string;
  nameEn?: string;
  flagEmoji?: string;
  isActive: boolean;
}

export interface UpdateNationalityDto {
  id: number;
  nameAr: string;
  nameEn?: string;
  flagEmoji?: string;
  isActive: boolean;
}

export interface NationalitySearchParams {
  isActive?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface IdDto {
  id: number;
}
