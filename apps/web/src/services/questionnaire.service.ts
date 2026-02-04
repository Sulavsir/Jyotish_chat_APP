import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { QuestionnaireCategory, QuestionnaireLanguage } from '@jyotish/shared';

export interface QuestionnairesResponse {
  categories: QuestionnaireCategory[];
}

export const questionnaireService = {
  async listPublic(language?: QuestionnaireLanguage): Promise<QuestionnairesResponse> {
    const params = language ? { language } : {};
    const response = await apiClient.get<{ categories: QuestionnaireCategory[] }>(
      API_ENDPOINTS.QUESTIONNAIRES.PUBLIC_LIST,
      { params }
    );
    return response;
  },
};
