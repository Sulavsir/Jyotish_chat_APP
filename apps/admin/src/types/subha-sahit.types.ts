/**
 * Subha Sahit Types
 */

export interface SubhaSahitDate {
  id: string;
  date: string; // ISO date string
  occasion: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubhaSahitDateRequest {
  date: string;
  occasion: string;
  description?: string;
}

export interface CreateSubhaSahitDatesRequest {
  dates: CreateSubhaSahitDateRequest[];
}

export interface UpdateSubhaSahitDateRequest {
  date?: string;
  occasion?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ListSubhaSahitDatesParams {
  occasion?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ListSubhaSahitDatesResponse {
  dates: SubhaSahitDate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSubhaSahitDatesResponse {
  dates: SubhaSahitDate[];
}

export interface UpdateSubhaSahitDateResponse {
  date: SubhaSahitDate;
}
