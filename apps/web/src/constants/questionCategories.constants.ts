/**
 * Question Categories and Predefined Questions
 */

export interface QuestionCategory {
  id: string;
  name: string;
  emoji: string;
  questions: string[];
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'marriage',
    name: 'Marriage (Top Asked)',
    emoji: '❤️',
    questions: [
      'When will I get married?',
      'Why is my marriage getting delayed?',
      'Will my marriage be love or arranged?',
      'How will my married life be?',
      'Is Manglik affecting my marriage?',
    ],
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    emoji: '💕',
    questions: [
      'Will my love relationship turn into marriage?',
      'Why did my relationship fail?',
      'Is reconciliation possible?',
      'Are we compatible?',
      'Will I find true love soon?',
    ],
  },
  {
    id: 'career',
    name: 'Career & Job',
    emoji: '💼',
    questions: [
      'When will I get a job?',
      'When will I get promotion or growth?',
      'Should I change my job?',
      'Which career is best for me?',
      'Why is my career unstable?',
    ],
  },
  {
    id: 'business',
    name: 'Business & Money',
    emoji: '🏢',
    questions: [
      'Is business suitable for me?',
      'When should I start a business?',
      'Will my business be successful?',
      'When will my financial condition improve?',
      'Is this a good time to invest?',
    ],
  },
  {
    id: 'dasha',
    name: 'Dasha (Planetary Periods)',
    emoji: '🪐',
    questions: [
      'How is my current Dasha?',
      'When will this difficult phase end?',
      'How will my next Dasha be?',
      'Which Dasha is best for marriage or career?',
      'How to reduce negative Dasha effects?',
    ],
  },
  {
    id: 'horoscope',
    name: 'Horoscope & Future',
    emoji: '📜',
    questions: [
      'How will my future be?',
      'How will this year go for me?',
      'What major changes are coming?',
      'Is this a good time to start something new?',
      'What does my horoscope indicate?',
    ],
  },
  {
    id: 'travel',
    name: 'Foreign Travel',
    emoji: '🌍',
    questions: [
      'Will I go abroad?',
      'When will I travel abroad?',
      'Will I settle abroad?',
      'Is overseas job possible?',
      'Is foreign education indicated?',
    ],
  },
];
