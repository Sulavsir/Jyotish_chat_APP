/**
 * Admin Chat Constants
 * Predefined Q&A for support widget
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

// FAQs for Clients
export const CLIENT_FAQS: FAQItem[] = [
  {
    question: 'How do I top up my balance?',
    answer: 'You can top up your balance by going to the Pricing page. We offer various balance packs and unlimited chat plans. Simply select a plan and complete the payment.',
    category: 'Billing',
  },
  {
    question: 'How do I chat with an astrologer?',
    answer: 'You can chat with astrologers by browsing the Astrologers page, selecting an astrologer, and clicking "Chat Now" or "Request Instant Chat". Make sure you have sufficient balance.',
    category: 'Chat',
  },
  {
    question: 'What are the different astrologer categories?',
    answer: 'We have three categories: ORDINARY (direct chat, fee per message in NRs), PROFESSIONAL (direct chat and appointments, fee per message in NRs), and PREMIUM (appointments only, no direct chat).',
    category: 'General',
  },
  {
    question: 'How do I book an appointment?',
    answer: 'Only PROFESSIONAL astrologers accept appointments. Go to their profile page and click "Book Appointment". Select your preferred date and time, then confirm the booking.',
    category: 'Appointments',
  },
  {
    question: 'What happens if I run out of balance?',
    answer: 'If you run out of balance, you can top up from the Pricing page. The system will notify you when your balance is low and prompt you to add more.',
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
    answer: 'Unlimited chat plans allow you to chat with any astrologer without balance deduction for a specified period (1 day, 3 days, 7 days, etc.). You can purchase these with money or use your balance.',
    category: 'Billing',
  },
  {
    question: 'How do I report an issue?',
    answer: 'You can report issues by creating a complaint from your dashboard or by chatting with our admin team through this support widget. We take all complaints seriously and respond promptly.',
    category: 'Support',
  },
  {
    question: 'Can I chat with multiple astrologers at once?',
    answer: 'Yes! You can have multiple active chats with different astrologers simultaneously. Each chat is independent and uses balance separately based on the astrologer\'s category.',
    category: 'Chat',
  },
];

// FAQs for Admins
export const ADMIN_FAQS: FAQItem[] = [
  {
    question: 'How do I manage astrologers?',
    answer: 'Go to the Astrologers section in the admin panel. You can create, edit, activate/deactivate astrologers, and manage their categories (ORDINARY, PROFESSIONAL, PREMIUM).',
    category: 'Management',
  },
  {
    question: 'How do I handle user complaints?',
    answer: 'Navigate to the Complaints section. Review each complaint, update its status (PENDING, IN_REVIEW, RESOLVED, DISMISSED), and take appropriate action. You can also communicate with users through admin chat.',
    category: 'Support',
  },
  {
    question: 'How do I monitor chats?',
    answer: 'Use the Chat Monitor section to view all active conversations between users and astrologers. You can view messages, abandon inappropriate chats, and unblock chats if needed.',
    category: 'Monitoring',
  },
  {
    question: 'How do I manage pricing plans?',
    answer: 'Go to the Pricing section to create, edit, or toggle pricing plans. You can set balance packs, unlimited chat plans, prices, discounts, and validity periods.',
    category: 'Management',
  },
  {
    question: 'How do I add balance to a user?',
    answer: 'Go to the Users section, select a user, and click "Add Balance". Enter the amount and reason. This is useful for refunds or promotional credits.',
    category: 'Management',
  },
  {
    question: 'How do I view earnings and payouts?',
    answer: 'Check the Earnings section to see all astrologer earnings, filter by astrologer, and process payouts. Earnings are calculated based on commission rates.',
    category: 'Financial',
  },
  {
    question: 'How do I manage appointments?',
    answer: 'View all appointments in the Appointments section. You can see appointment details, status, and filter by various criteria. Appointments are created by clients with PROFESSIONAL astrologers.',
    category: 'Management',
  },
  {
    question: 'What is the Chat Audit section?',
    answer: 'Chat Audit shows all broadcast messages, instant chat requests, and their statuses. This helps you monitor platform activity and ensure proper functioning.',
    category: 'Monitoring',
  },
  {
    question: 'How do I respond to admin chat messages?',
    answer: 'Go to the Admin Chats section to view all support conversations. Click on a chat to view messages and respond. You can update chat status (ACTIVE, RESOLVED, CLOSED) and assign chats to other admins.',
    category: 'Support',
  },
  {
    question: 'How do I view audit logs?',
    answer: 'The Audit Logs section shows all platform activities including user actions, astrologer actions, and admin actions. Filter by user, astrologer, or action type for detailed tracking.',
    category: 'Monitoring',
  },
];

// Default to CLIENT_FAQS for backward compatibility
export const PREDEFINED_FAQS = CLIENT_FAQS;

// Client FAQ Categories
export const CLIENT_FAQ_CATEGORIES = [
  'All',
  'Billing',
  'Chat',
  'Appointments',
  'Account',
  'Support',
  'General',
] as const;

// Admin FAQ Categories
export const ADMIN_FAQ_CATEGORIES = [
  'All',
  'Management',
  'Support',
  'Monitoring',
  'Financial',
] as const;

// Default to CLIENT_FAQ_CATEGORIES for backward compatibility
export const FAQ_CATEGORIES = CLIENT_FAQ_CATEGORIES;

export type FAQCategory = (typeof CLIENT_FAQ_CATEGORIES)[number] | (typeof ADMIN_FAQ_CATEGORIES)[number];
