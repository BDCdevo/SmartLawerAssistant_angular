export interface Document {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  caseId?: string;
  clientId?: string;
  category: DocumentCategory;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  tags?: string[];
}

export enum DocumentCategory {
  CONTRACT = 'contract',
  EVIDENCE = 'evidence',
  COURT_FILING = 'court_filing',
  CORRESPONDENCE = 'correspondence',
  IDENTIFICATION = 'identification',
  OTHER = 'other'
}

export interface UploadDocumentRequest {
  file: File;
  name: string;
  category: DocumentCategory;
  caseId?: string;
  clientId?: string;
  tags?: string[];
}
