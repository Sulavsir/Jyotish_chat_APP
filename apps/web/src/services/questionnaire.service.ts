import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { QuestionnaireCategory } from '@jyotish/shared';

export interface QuestionnairesResponse {
  categories: QuestionnaireCategory[];
}

export const questionnaireService = {
  async listPublic(): Promise<QuestionnairesResponse> {
    const response = await apiClient.get<{ categories: QuestionnaireCategory[] }>(
      API_ENDPOINTS.QUESTIONNAIRES.PUBLIC_LIST
    );
    return response;
  },
};

