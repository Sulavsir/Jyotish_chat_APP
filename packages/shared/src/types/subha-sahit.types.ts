/**
 * Subha Sahit & Book Pujari Ji — shared API shapes
 */

/** Query param and JSON language code for Subha Sahit APIs */
export type SubhaSahitApiLanguage = 'en' | 'ne' | 'hi';

/**
 * One occasion with optional details for the booking UI.
 * When `language` is omitted, the list was requested with `?language=` (client web).
 * When `language` is set on each item, the list is unscoped (e.g. admin).
 */
export interface SubhaSahitOccasionListItem {
  occasion: string;
  language?: SubhaSahitApiLanguage;
  pujaItems: string | null;
  estimatedTime: string | null;
}

export interface ListSubhaSahitOccasionsResponse {
  occasions: SubhaSahitOccasionListItem[];
}

export interface CreateSubhaSahitOccasionRequest {
  name: string;
  language?: SubhaSahitApiLanguage;
  /** Comma-separated, e.g. thal, batuka, vada */
  pujaItems?: string | null;
  estimatedTime?: string | null;
}

export interface UpdateSubhaSahitOccasionMetaRequest {
  language: SubhaSahitApiLanguage;
  occasion: string;
  pujaItems?: string | null;
  estimatedTime?: string | null;
}

/** Admin: remove occasion catalog entry (placeholder rows + meta). Blocked if real Subha Sahit dates exist. */
export interface DeleteSubhaSahitOccasionRequest {
  language: SubhaSahitApiLanguage;
  occasion: string;
}
