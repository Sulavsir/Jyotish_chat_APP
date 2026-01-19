/**
 * Admin Chat Constants
 * Predefined Q&A for support widget
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const PREDEFINED_FAQS: FAQItem[] = [
  {
    question: 'How do I purchase coins?',
    answer: 'You can purchase coins by going to the Pricing page. We offer various coin packs and unlimited chat plans. Simply select a plan and complete the payment.',
    category: 'Billing',
  },
  {
    question: 'How do I chat with an astrologer?',
    answer: 'You can chat with astrologers by browsing the Astrologers page, selecting an astrologer, and clicking "Chat Now" or "Request Instant Chat". Make sure you have sufficient coins.',
    category: 'Chat',
  },
  {
    question: 'What are the different astrologer categories?',
    answer: 'We have three categories: ORDINARY (direct chat, 1 coin per message), PROFESSIONAL (direct chat and appointments, 2 coins per message), and PREMIUM (appointments only, no direct chat).',
    category: 'General',
  },
  {
    question: 'How do I book an appointment?',
    answer: 'Only PROFESSIONAL astrologers accept appointments. Go to their profile page and click "Book Appointment". Select your preferred date and time, then confirm the booking.',
    category: 'Appointments',
  },
  {
    question: 'What happens if I run out of coins?',
    answer: 'If you run out of coins, you can purchase more from the Pricing page. The system will notify you when your balance is low and prompt you to purchase more coins.',
    category: 'Billing',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Refund policies vary by plan. Please contact our support team through this chat widget for specific refund requests. We review each case individually.',
    category: 'Billing',
  },
  {
    question: 'How do I update my profile?',
    answer: 'Go to your Profile page from the dashboard menu. You can update your personal information, birth details, and profile photo. Completing your profile helps astrologers provide better readings.',
    category: 'Account',
  },
  {
    question: 'What is an unlimited chat plan?',
    answer: 'Unlimited chat plans allow you to chat with any astrologer without coin deduction for a specified period (1 day, 3 days, 7 days, etc.). You can purchase these with money or coins.',
    category: 'Billing',
  },
  {
    question: 'How do I report an issue?',
    answer: 'You can report issues by creating a complaint from your dashboard or by chatting with our admin team through this support widget. We take all complaints seriously and respond promptly.',
    category: 'Support',
  },
  {
    question: 'Can I chat with multiple astrologers at once?',
    answer: 'Yes! You can have multiple active chats with different astrologers simultaneously. Each chat is independent and uses coins separately based on the astrologer\'s category.',
    category: 'Chat',
  },
];

export const FAQ_CATEGORIES = [
  'All',
  'Billing',
  'Chat',
  'Appointments',
  'Account',
  'Support',
  'General',
] as const;

export type FAQCategory = (typeof FAQ_CATEGORIES)[number];
