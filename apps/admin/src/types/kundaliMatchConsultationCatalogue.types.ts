export interface KundaliConsultationQuestionAdminDTO {
  id: string;
  textNe: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight full list for resolving selected topic IDs on match requests. */
export interface KundaliConsultationCatalogueLookupResponse {
  titleNe: string;
  questions: Array<{ id: string; textNe: string; sortOrder: number }>;
}

export interface PaginatedKundaliConsultationTopicsResponse {
  titleNe: string;
  questions: KundaliConsultationQuestionAdminDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Alias for lookup shape used when displaying consultation topics beside a request. */
export type KundaliConsultationCatalogueAdminResponse = KundaliConsultationCatalogueLookupResponse;
