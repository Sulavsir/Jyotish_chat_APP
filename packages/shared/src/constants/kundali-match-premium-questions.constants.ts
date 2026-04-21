/**
 * Premium Kundali Matching consultation — fixed question catalogue (Nepali).
 * IDs are stable for API storage and mobile clients.
 */

export const KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE =
  'कुण्डली मिलान सम्बन्धी ज्योतिषीय परामर्श (Premium Kundali Matching Consultation)';

export const KUNDALI_MATCH_PREMIUM_QUESTION_IDS = [
  'KM_PREMIUM_Q1',
  'KM_PREMIUM_Q2',
  'KM_PREMIUM_Q3',
  'KM_PREMIUM_Q4',
  'KM_PREMIUM_Q5',
  'KM_PREMIUM_Q6',
  'KM_PREMIUM_Q7',
  'KM_PREMIUM_Q8',
  'KM_PREMIUM_Q9',
  'KM_PREMIUM_Q10',
] as const;

export type KundaliMatchPremiumQuestionId = (typeof KUNDALI_MATCH_PREMIUM_QUESTION_IDS)[number];

export interface KundaliMatchPremiumConsultationQuestion {
  readonly id: KundaliMatchPremiumQuestionId;
  /** Full question line in Nepali (no leading numerals — ordered lists add numbering in UI). */
  readonly textNe: string;
}

export const KUNDALI_MATCH_PREMIUM_CONSULTATION_QUESTIONS: readonly KundaliMatchPremiumConsultationQuestion[] =
  [
    {
      id: 'KM_PREMIUM_Q1',
      textNe:
        'हाम्रो दुवै जनाको कुण्डली मिलान कस्तो देखिन्छ? कुल गुण मिलान (guna milan) कति छ र यसको समग्र परिणाम कस्तो हुन्छ?',
    },
    {
      id: 'KM_PREMIUM_Q2',
      textNe:
        'हाम्रो स्वभाव, सोच र व्यवहार कत्तिको मिल्ने देखिन्छ? दीर्घकालीन रूपमा compatibility कस्तो रहने सम्भावना छ?',
    },
    {
      id: 'KM_PREMIUM_Q3',
      textNe:
        'हाम्रो सम्बन्ध भविष्यमा कत्तिको स्थिर र सफल रहने देखिन्छ? सम्बन्धमा उतार–चढाव आउने सम्भावना कस्तो छ?',
    },
    {
      id: 'KM_PREMIUM_Q4',
      textNe:
        'विवाहपछि हाम्रो दाम्पत्य जीवन (relationship, trust, emotional bonding) कस्तो रहने देखिन्छ?',
    },
    {
      id: 'KM_PREMIUM_Q5',
      textNe:
        'कुण्डलीमा कुनै दोष (जस्तै माङ्गलिक दोष, ग्रह दोष आदि) छन् कि छैनन्? यदि छन् भने त्यसले सम्बन्धमा कस्तो असर पार्छ?',
    },
    {
      id: 'KM_PREMIUM_Q6',
      textNe:
        'आर्थिक अवस्था, करियर र पारिवारिक जीवनमा हाम्रो मिलान कस्तो देखिन्छ? विवाहपछि stability कस्तो रहने सम्भावना छ?',
    },
    {
      id: 'KM_PREMIUM_Q7',
      textNe:
        'विवाहपछि हामीबीच दूरी (ताढिनु), अलग बसाइ वा सम्बन्धमा चिसोपन आउने सम्भावना कत्तिको छ? यसको कारण के हुन सक्छ?',
    },
    {
      id: 'KM_PREMIUM_Q8',
      textNe:
        'सन्तान (children) सम्बन्धी योग कस्तो देखिन्छ? भविष्यमा पारिवारिक जीवनमा कस्तो अवस्था रहने सम्भावना छ?',
    },
    {
      id: 'KM_PREMIUM_Q9',
      textNe:
        'दुवै जनाको ग्रहदशा र गोचरले हाम्रो सम्बन्ध र विवाहमा कस्तो प्रभाव पार्ने देखिन्छ? कुन समय राम्रो वा संवेदनशील हुन सक्छ?',
    },
    {
      id: 'KM_PREMIUM_Q10',
      textNe:
        'यदि कुण्डलीमा केही कमजोरी वा दोष छन् भने, त्यसलाई सुधार गर्न कुन मन्त्र, पूजा, दान वा उपाय अपनाउनु उपयुक्त हुन्छ?',
    },
  ];

const PREMIUM_QUESTION_BY_ID = new Map(
  KUNDALI_MATCH_PREMIUM_CONSULTATION_QUESTIONS.map((q) => [q.id, q])
);

/** Returns questions in catalogue order for the given stored IDs. */
export function orderKundaliMatchPremiumQuestionIds(
  ids: readonly string[]
): KundaliMatchPremiumConsultationQuestion[] {
  const set = new Set(ids);
  return KUNDALI_MATCH_PREMIUM_CONSULTATION_QUESTIONS.filter((q) => set.has(q.id));
}

export function getKundaliMatchPremiumQuestionById(
  id: string
): KundaliMatchPremiumConsultationQuestion | undefined {
  return PREMIUM_QUESTION_BY_ID.get(id as KundaliMatchPremiumQuestionId);
}
