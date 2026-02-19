/**
 * Frontend-only translations for dashboard and related UI.
 * Language is driven by useQuestionnaireLanguageStore (NEPALI, HINDI, ENGLISH).
 * Use placeholders: {name}, {count} — replace in components when calling t().
 */

import type { QuestionnaireLanguage } from '@jyotish/shared';

type Lang = QuestionnaireLanguage;

const EN: Record<string, string> = {
  // Dashboard welcome
  yourDashboard: 'Your dashboard',
  welcomeBack: 'Welcome back, {name}',
  exploreHoroscope: 'Explore your horoscope, chat with astrologers, or book a consultation.',

  // Online astrologers card
  astrologersOnlineNow: '{count} Astrologers Online Now',
  startLiveChat: 'Start live chat with Jyotish',
  fullKundaliReview: 'Full Kundali Review',
  fullKundaliReviewDesc: 'Book a detailed kundali analysis with expert Jyotish.',
  instantConnection: 'Instant Connection',
  instantConnectionDesc:
    'Get instant answers from verified Jyotish who are currently online and ready to chat.',
  verifiedJyotish: 'Verified Jyotish',
  verifiedJyotishDesc:
    'Only approved Jyotish with completed profiles and ratings appear here for instant chat.',
  availableNow: 'Available Now',
  noAstrologersOnline: 'No astrologers online at the moment',
  checkBackSoon: 'Check back soon!',

  // Ask questions section
  askYourQuestion: 'Ask your question.',
  chooseHowToContact:
    'Choose how you want to reach Jyotish: one-on-one or broadcast to everyone.',
  chatWithSpecificJyotish: 'Chat with specific Jyotish',
  publishToAllJyotish: 'Publish to all Jyotish',
  selectJyotishToStart: 'Select a Jyotish from the dropdown above to start a private chat.',
  selectCategory: 'Select Category',
  selectCategoryPlaceholder: 'Select a category',
  selectQuestion: 'Select Question',
  selectQuestionPlaceholder: 'Select a question or type your own',
  typeQuestionForJyotish: 'Type your question for this Jyotish',
  editQuestionBeforeSending: 'Edit question before sending to this Jyotish',
  typeQuestionHere: 'Type your question for this Jyotish...',
  orTypeToAll: 'Or type your question to publish to all Jyotish',
  orEditBeforePublish: 'Or edit question before publishing to all Jyotish',
  typeQuestionToPublishPlaceholder: 'Type your question to publish to all Jyotish...',
  sendMessageToAll: 'Publish Message to All Jyotish',
  clearSelection: 'Clear selection',
  clearQuestion: 'Clear question',
  startChat: 'Start Chat',
  searchingForJyotish: 'Searching for Available Jyotish',
  messageBroadcastedWaiting:
    'Your message has been broadcasted. Waiting for an astrologer to accept...',
  categoryChoose: 'Select Category',
  orTypeQuestionToAll: 'Or type your question to publish to all Jyotish',
  yourQuestionPublishedToAll: 'Your question will be published to all available Jyotish.',
  firstToAcceptStartsChat:
    'The first astrologer to accept will start a private chat with you. Make your question clear so the right Jyotish can respond.',
  selectProfile: 'Select profile',
  publish: 'Publish',
  sending: 'Sending...',
  all: 'All',

  // Services grid
  chatWithJyotish: 'Chat with Jyotish',
  dailyHoroscope: 'Daily Horoscope',
  kundaliMatch: 'Kundali Match',
  bookPanditJi: 'Book Pandit Ji',
  bookVaastuSastri: 'Book Vaastu Sastri',
  kathaVachak: 'Katha Vachak',
  travelPredictions: 'Travel Predictions',

  // Dashboard page - Rashifal / spiritual section
  yourSpiritualCompanion: 'Your spiritual companion',
  needPersonalConsultation: 'Do you need personal astro consultation?',
  enterBirthDetails: 'Please enter your birth details.',
  instantGuidance: 'Instant Guidance',
  instantGuidanceDesc: 'Get instant answers via real-time chat with verified Jyotish.',
  personalizedInsights: 'Personalized Insights',
  personalizedInsightsDesc: 'Kundali review, match, and predictions as per birth details.',
  services: 'Services',
  servicesDesc: 'Choose what you want to do next. Chat is highlighted for quick help.',
  completeYourProfile: 'Complete your profile',
  completeProfileDesc:
    'To access features like horoscope, chat with astrologers, and bookings, you need to complete your profile with birth details.',
  goToProfile: 'Go to Profile',
  quickTip: 'Quick tip',
  completeProfileTip: 'Complete your profile',
  completeProfileTipDesc: 'Enter birth details and complete profile for accurate insights.',
  verifyingAccess: 'Verifying access...',

  // Modals
  bookPanditJiTitle: 'Book Pandit Ji',
  bookVaastuSastriTitle: 'Book Vaastu Sastri',
  bookKathaVachakTitle: 'Book Katha Vachak',

  // Coins / chat
  youNeedCoins: 'You need at least {count} coins (deducted when Jyotish accepts). Your balance: {balance}. Please top up to book.',
  topUp: 'Top up',
  messageCannotBeEmpty: 'Message cannot be empty',
};

const NE: Record<string, string> = {
  yourDashboard: 'तपाईंको ड्यासबोर्ड',
  welcomeBack: 'फेरि स्वागत छ, {name}',
  exploreHoroscope:
    'आफ्नो राशिफल हेर्नुहोस्, ज्योतिषीसँग कुराकानी गर्नुहोस्, वा परामर्श बुक गर्नुहोस्।',

  astrologersOnlineNow: '{count} जना ज्योतिषी अहिले अनलाइन छन्',
  startLiveChat: 'ज्योतिषीसँग लाइभ च्याट सुरु गर्नुहोस्',
  fullKundaliReview: 'पूर्ण कुण्डली समीक्षा',
  fullKundaliReviewDesc: 'विशेषज्ञ ज्योतिषीसँग विस्तृत कुण्डली विश्लेषण बुक गर्नुहोस्।',
  instantConnection: 'तुरुन्त जडान',
  instantConnectionDesc:
    'हाल अनलाइन र च्याटका लागि तयार प्रमाणित ज्योतिषीबाट तुरुन्त उत्तर पाउनुहोस्।',
  verifiedJyotish: 'प्रमाणित ज्योतिषी',
  verifiedJyotishDesc:
    'प्रोफाइल पूरा गरेका र रेटिङ प्राप्त गरेका स्वीकृत ज्योतिषी मात्र यहाँ देखाइन्छन्।',
  availableNow: 'अहिले उपलब्ध',
  noAstrologersOnline: 'अहिले कुनै ज्योतिषी अनलाइन छैनन्',
  checkBackSoon: 'पछि फेरि जाँच गर्नुहोस्!',

  askYourQuestion: 'तपाईंको प्रश्न राख्नुहोस्।',
  chooseHowToContact:
    'ज्योतिषीसँग कसरी सम्पर्क गर्ने चाहनुहुन्छ छनोट गर्नुहोस्: एक-एक गरी वा सबैलाई प्रसारण गरेर।',
  chatWithSpecificJyotish: 'विशेष ज्योतिषीसँग च्याट गर्नुहोस्',
  publishToAllJyotish: 'सबै ज्योतिषीलाई पठाउनुहोस्',
  selectJyotishToStart: 'निजी च्याट सुरु गर्न माथिको ड्रपडाउनबाट ज्योतिषी छनोट गर्नुहोस्।',
  selectCategory: 'कोटि छनोट गर्नुहोस्',
  selectCategoryPlaceholder: 'कोटि छनोट गर्नुहोस्',
  selectQuestion: 'प्रश्न छनोट गर्नुहोस्',
  selectQuestionPlaceholder: 'प्रश्न छनोट गर्नुहोस् वा आफ्नो टाइप गर्नुहोस्',
  typeQuestionForJyotish: 'यस ज्योतिषीको लागि आफ्नो प्रश्न टाइप गर्नुहोस्',
  editQuestionBeforeSending: 'यस ज्योतिषीलाई पठाउनु अघि प्रश्न सम्पादन गर्नुहोस्',
  typeQuestionHere: 'यहाँ आफ्नो प्रश्न टाइप गर्नुहोस्...',
  orTypeToAll: 'सबै ज्योतिषीलाई पठाउन आफ्नो प्रश्न टाइप गर्नुहोस्',
  orEditBeforePublish: 'सबै ज्योतिषीलाई प्रकाशन गर्नु अघि प्रश्न सम्पादन गर्नुहोस्',
  typeQuestionToPublishPlaceholder: 'यहाँ आफ्नो प्रश्न टाइप गर्नुहोस्...',
  sendMessageToAll: 'सबै ज्योतिषीलाई सन्देश पठाउनुहोस्',
  clearSelection: 'छनोट खाली गर्नुहोस्',
  clearQuestion: 'प्रश्न खाली गर्नुहोस्',
  startChat: 'च्याट सुरु गर्नुहोस्',
  searchingForJyotish: 'उपलब्ध ज्योतिषी खोजिँदै छ',
  messageBroadcastedWaiting:
    'तपाईंको सन्देश प्रसारण भइसक्यो। ज्योतिषीले स्वीकार गर्न पर्खिँदै...',
  categoryChoose: 'कोटि छनोट गर्नुहोस्',
  orTypeQuestionToAll: 'सबै ज्योतिषीलाई पठाउन आफ्नो प्रश्न टाइप गर्नुहोस्',
  yourQuestionPublishedToAll: 'तपाईंको प्रश्न सबै उपलब्ध ज्योतिषीलाई पठाइनेछ।',
  firstToAcceptStartsChat:
    'सबैभन्दा पहिले स्वीकार गर्ने ज्योतिषीसँग निजी च्याट सुरु हुनेछ। कृपया आफ्नो प्रश्न स्पष्ट राख्नुहोस्।',
  selectProfile: 'प्रोफाइल छनोट गर्नुहोस्',
  publish: 'प्रकाशन गर्नुहोस्',
  sending: 'पठाइँदै...',
  all: 'सबै',

  chatWithJyotish: 'ज्योतिषीसँग च्याट गर्नुहोस्',
  dailyHoroscope: 'दैनिक राशिफल',
  kundaliMatch: 'कुण्डली मिलान',
  bookPanditJi: 'पण्डितजी बुक गर्नुहोस्',
  bookVaastuSastri: 'वास्तु शास्त्री बुक गर्नुहोस्',
  kathaVachak: 'कथा वाचक',
  travelPredictions: 'यात्रा भविष्यवाणी',

  yourSpiritualCompanion: 'तपाईंको आध्यात्मिक साथी',
  needPersonalConsultation: 'के तपाईंलाई व्यक्तिगत ज्योतिष परामर्श चाहिएको छ?',
  enterBirthDetails: 'कृपया आफ्नो जन्म विवरण प्रविष्ट गर्नुहोस्।',
  instantGuidance: 'तुरुन्त मार्गदर्शन',
  instantGuidanceDesc: 'प्रमाणित ज्योतिषीसँग real-time च्याट गरेर तुरुन्त उत्तर पाउनुहोस्।',
  personalizedInsights: 'व्यक्तिगत सुझाव',
  personalizedInsightsDesc: 'जन्म विवरण अनुसार कुण्डली समीक्षा, मिलान, र भविष्यवाणी।',
  services: 'सेवाहरू',
  servicesDesc:
    'अर्को के गर्न चाहनुहुन्छ छनोट गर्नुहोस्। छिटो सहयोगका लागि च्याट हाइलाइट गरिएको छ।',
  completeYourProfile: 'आफ्नो प्रोफाइल पूरा गर्नुहोस्',
  completeProfileDesc:
    'राशिफल, ज्योतिषीसँग च्याट र बुकिङ जस्ता सुविधाहरू पाउन जन्म विवरणसहित प्रोफाइल पूरा गर्नुहोस्।',
  goToProfile: 'प्रोफाइलमा जानुहोस्',
  quickTip: 'छिटो सुझाव',
  completeProfileTip: 'प्रोफाइल पूरा गर्नुहोस्',
  completeProfileTipDesc: 'सही अन्तर्दृष्टिको लागि जन्म विवरण र प्रोफाइल पूरा गर्नुहोस्।',
  verifyingAccess: 'पहुँच जाँचिँदै...',

  bookPanditJiTitle: 'पण्डितजी बुक गर्नुहोस्',
  bookVaastuSastriTitle: 'वास्तु शास्त्री बुक गर्नुहोस्',
  bookKathaVachakTitle: 'कथा वाचक',

  youNeedCoins:
    'कम्तीमा {count} सिक्का चाहिन्छ (ज्योतिषीले स्वीकार गर्दा कटौती)। तपाईंको ब्यालेन्स: {balance}. कृपया टप अप गर्नुहोस्।',
  topUp: 'टप अप',
  messageCannotBeEmpty: 'सन्देश खाली हुन सक्दैन',
};

const HI: Record<string, string> = {
  yourDashboard: 'आपका डैशबोर्ड',
  welcomeBack: 'वापसी पर स्वागत है, {name}',
  exploreHoroscope: 'अपना राशिफल देखें, ज्योतिषी से चैट करें, या परामर्श बुक करें।',

  astrologersOnlineNow: '{count} ज्योतिषी अभी ऑनलाइन हैं',
  startLiveChat: 'ज्योतिषी से लाइव चैट शुरू करें',
  fullKundaliReview: 'पूर्ण कुंडली समीक्षा',
  fullKundaliReviewDesc: 'विशेषज्ञ ज्योतिषी से विस्तृत कुंडली विश्लेषण बुक करें।',
  instantConnection: 'तुरंत कनेक्शन',
  instantConnectionDesc:
    'वर्तमान में ऑनलाइन और चैट के लिए तैयार सत्यापित ज्योतिषी से तुरंत उत्तर प्राप्त करें।',
  verifiedJyotish: 'सत्यापित ज्योतिषी',
  verifiedJyotishDesc:
    'केवल स्वीकृत, पूर्ण प्रोफ़ाइल और रेटिंग वाले ज्योतिषी ही यहाँ दिखाई देते हैं।',
  availableNow: 'अभी उपलब्ध',
  noAstrologersOnline: 'इस समय कोई ज्योतिषी ऑनलाइन नहीं है',
  checkBackSoon: 'जल्द ही वापस देखें!',

  askYourQuestion: 'अपना प्रश्न पूछें।',
  chooseHowToContact:
    'ज्योतिषी से कैसे संपर्क करना चाहते हैं चुनें: एक-से-एक या सभी को प्रसारण करें।',
  chatWithSpecificJyotish: 'किसी विशेष ज्योतिषी से चैट करें',
  publishToAllJyotish: 'सभी ज्योतिषियों को प्रकाशित करें',
  selectJyotishToStart: 'निजी चैट शुरू करने के लिए ऊपर ड्रॉपडाउन से ज्योतिषी चुनें।',
  selectCategory: 'श्रेणी चुनें',
  selectCategoryPlaceholder: 'श्रेणी चुनें',
  selectQuestion: 'प्रश्न चुनें',
  selectQuestionPlaceholder: 'प्रश्न चुनें या अपना टाइप करें',
  typeQuestionForJyotish: 'इस ज्योतिषी के लिए अपना प्रश्न टाइप करें',
  editQuestionBeforeSending: 'इस ज्योतिषी को भेजने से पहले प्रश्न संपादित करें',
  typeQuestionHere: 'यहाँ अपना प्रश्न टाइप करें...',
  orTypeToAll: 'सभी ज्योतिषियों को भेजने के लिए अपना प्रश्न टाइप करें',
  orEditBeforePublish: 'सभी ज्योतिषियों को प्रकाशित करने से पहले प्रश्न संपादित करें',
  typeQuestionToPublishPlaceholder: 'यहाँ अपना प्रश्न टाइप करें...',
  sendMessageToAll: 'सभी ज्योतिषियों को संदेश भेजें',
  clearSelection: 'चयन साफ़ करें',
  clearQuestion: 'प्रश्न साफ़ करें',
  startChat: 'चैट शुरू करें',
  searchingForJyotish: 'उपलब्ध ज्योतिषी खोज रहे हैं',
  messageBroadcastedWaiting:
    'आपका संदेश प्रसारित हो चुका है। ज्योतिषी के स्वीकार करने की प्रतीक्षा में...',
  categoryChoose: 'श्रेणी चुनें',
  orTypeQuestionToAll: 'सभी ज्योतिषियों को भेजने के लिए अपना प्रश्न टाइप करें',
  yourQuestionPublishedToAll: 'आपका प्रश्न सभी उपलब्ध ज्योतिषियों को भेजा जाएगा।',
  firstToAcceptStartsChat:
    'जो ज्योतिषी सबसे पहले स्वीकार करेगा, वह आपके साथ निजी चैट शुरू करेगा। कृपया अपना प्रश्न स्पष्ट रखें।',
  selectProfile: 'प्रोफ़ाइल चुनें',
  publish: 'प्रकाशित करें',
  sending: 'भेज रहे हैं...',
  all: 'सभी',

  chatWithJyotish: 'ज्योतिषी से चैट करें',
  dailyHoroscope: 'दैनिक राशिफल',
  kundaliMatch: 'कुंडली मिलान',
  bookPanditJi: 'पंडित जी बुक करें',
  bookVaastuSastri: 'वास्तु शास्त्री बुक करें',
  kathaVachak: 'कथा वाचक',
  travelPredictions: 'यात्रा भविष्यवाणी',

  yourSpiritualCompanion: 'आपका आध्यात्मिक साथी',
  needPersonalConsultation: 'क्या आपको व्यक्तिगत ज्योतिष परामर्श चाहिए?',
  enterBirthDetails: 'कृपया अपनी जन्म विवरण दर्ज करें।',
  instantGuidance: 'तुरंत मार्गदर्शन',
  instantGuidanceDesc: 'सत्यापित ज्योतिषी से रियल-टाइम चैट कर तुरंत उत्तर पाएं।',
  personalizedInsights: 'व्यक्तिगत सुझाव',
  personalizedInsightsDesc: 'जन्म विवरण के अनुसार कुंडली समीक्षा, मिलान और भविष्यवाणी।',
  services: 'सेवाएँ',
  servicesDesc: 'आगे क्या करना चाहते हैं चुनें। त्वरित सहायता के लिए चैट को हाइलाइट किया गया है।',
  completeYourProfile: 'अपना प्रोफ़ाइल पूरा करें',
  completeProfileDesc:
    'राशिफल, ज्योतिषी से चैट और बुकिंग जैसी सुविधाओं के लिए जन्म विवरण के साथ प्रोफ़ाइल पूरा करें।',
  goToProfile: 'प्रोफ़ाइल पर जाएं',
  quickTip: 'त्वरित सुझाव',
  completeProfileTip: 'प्रोफ़ाइल पूरा करें',
  completeProfileTipDesc: 'सटीक अंतर्दृष्टि के लिए जन्म विवरण और प्रोफ़ाइल पूरा करें।',
  verifyingAccess: 'पहुँच सत्यापित हो रही है...',

  bookPanditJiTitle: 'पंडित जी बुक करें',
  bookVaastuSastriTitle: 'वास्तु शास्त्री बुक करें',
  bookKathaVachakTitle: 'कथा वाचक',

  youNeedCoins:
    'कम से कम {count} सिक्के चाहिए (ज्योतिषी स्वीकार करने पर काटे जाएंगे)। आपका बैलेंस: {balance}. कृपया टॉप अप करें।',
  topUp: 'टॉप अप',
  messageCannotBeEmpty: 'संदेश खाली नहीं हो सकता',
};

const MAP: Record<Lang, Record<string, string>> = {
  ENGLISH: EN,
  NEPALI: NE,
  HINDI: HI,
};

export function getTranslation(
  language: Lang,
  key: string,
  params?: { name?: string; count?: string | number; balance?: string | number }
): string {
  const dict = MAP[language] ?? EN;
  let text = dict[key] ?? EN[key] ?? key;
  if (params) {
    if (params.name !== undefined) text = text.replace(/\{name\}/g, String(params.name));
    if (params.count !== undefined) text = text.replace(/\{count\}/g, String(params.count));
    if (params.balance !== undefined) text = text.replace(/\{balance\}/g, String(params.balance));
  }
  return text;
}
