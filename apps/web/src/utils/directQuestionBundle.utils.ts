/**
 * Build question items for POST /chat/send-direct-question-bundle (order = checklist order, then custom lines).
 */
import type { QuestionnaireCategory } from '@jyotish/shared';

export function buildDirectBundleQuestionItems(
  orderedIds: string[],
  categories: QuestionnaireCategory[],
  customTexts: string[]
): { id: string; text: string; isCustom?: boolean }[] {
  const idToText = new Map<string, string>();
  for (const cat of categories) {
    for (const q of cat.questions) {
      idToText.set(q.id, q.text);
    }
  }
  const items: { id: string; text: string; isCustom?: boolean }[] = [];
  for (const id of orderedIds) {
    const text = idToText.get(id);
    if (text) items.push({ id, text });
  }
  customTexts.forEach((t, i) => {
    const trimmed = t.trim();
    if (trimmed) items.push({ id: `custom:${i}`, text: trimmed, isCustom: true });
  });
  return items;
}
