export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: string | null;
  data: T;
  errors: string[] | null;
  meta: any | null;
  traceId: string | null;
  timestamp: string;
  links: any | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IdDto {
  id: number;
}
