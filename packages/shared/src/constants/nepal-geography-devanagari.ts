/**
 * Devanagari labels for Nepal provinces and districts (seed `nameEn` keys).
 * Used for admin (and other UIs) when Nepali or Hindi display is selected.
 * Falls back to English when a key is missing.
 */

export const NEPAL_GEO_DEVANAGARI_BY_EN: Readonly<Record<string, string>> = {
  // Provinces
  Koshi: 'कोशी',
  Madhesh: 'मधेश',
  Bagmati: 'बागमती',
  Gandaki: 'गण्डकी',
  Lumbini: 'लुम्बिनी',
  Karnali: 'कर्णाली',
  Sudurpashchim: 'सुदूरपश्चिम',
  // Koshi
  Bhojpur: 'भोजपुर',
  Dhankuta: 'धनकुटा',
  Ilam: 'इलाम',
  Jhapa: 'झापा',
  Khotang: 'खोटाङ',
  Morang: 'मोरङ',
  Okhaldhunga: 'ओखलढुंगा',
  Panchthar: 'पाञ्चथर',
  Sankhuwasabha: 'संखुवासभा',
  Solukhumbu: 'सोलुखुम्बु',
  Sunsari: 'सुनसरी',
  Taplejung: 'ताप्लेजुङ',
  Tehrathum: 'तेह्रथुम',
  Udayapur: 'उदयपुर',
  // Madhesh
  Bara: 'बारा',
  Dhanusha: 'धनुषा',
  Mahottari: 'महोत्तरी',
  Parsa: 'पर्सा',
  Rautahat: 'रौतहट',
  Saptari: 'सप्तरी',
  Sarlahi: 'सर्लाही',
  Siraha: 'सिरहा',
  // Bagmati
  Bhaktapur: 'भक्तपुर',
  Chitwan: 'चितवन',
  Dhading: 'धादिङ',
  Dolakha: 'दोलखा',
  Kathmandu: 'काठमाडौं',
  Kavrepalanchok: 'काभ्रेपलाञ्चोक',
  Lalitpur: 'ललितपुर',
  Makwanpur: 'मकवानपुर',
  Nuwakot: 'नुवाकोट',
  Ramechhap: 'रामेछाप',
  Rasuwa: 'रसुवा',
  Sindhuli: 'सिन्धुली',
  Sindhupalchok: 'सिन्धुपाल्चोक',
  // Gandaki
  Baglung: 'बागलुङ',
  Gorkha: 'गोरखा',
  Kaski: 'कास्की',
  Lamjung: 'लमजुङ',
  Manang: 'मनाङ',
  Mustang: 'मुस्ताङ',
  Myagdi: 'म्याग्दी',
  Nawalpur: 'नवलपरासी (बर्दघाट सुस्ता पूर्व)',
  Parbat: 'पर्वत',
  Syangja: 'स्याङ्जा',
  Tanahun: 'तनहुँ',
  // Lumbini
  Arghakhanchi: 'अर्घाखਾਂची',
  Banke: 'बाँके',
  Bardiya: 'बर्दिया',
  Dang: 'दाङ',
  Gulmi: 'गुल्मी',
  Kapilvastu: 'कपिलवस्तु',
  Parasi: 'परासी (नवलपरासी पश्चिम)',
  Palpa: 'पाल्पा',
  Pyuthan: 'प्युठान',
  Rolpa: 'रोल्पा',
  'Rukum East': 'पूर्वी रुकुम',
  Rupandehi: 'रुपन्देही',
  // Karnali
  Dailekh: 'दैलेख',
  Dolpa: 'डोल्पा',
  Humla: 'हुम्ला',
  Jajarkot: 'जाजरकोट',
  Jumla: 'जुम्ला',
  Kalikot: 'कालिकोट',
  Mugu: 'मुगु',
  'Rukum West': 'पश्चिमी रुकुम',
  Salyan: 'सल्यान',
  Surkhet: 'सुर्खेत',
  // Sudurpashchim
  Achham: 'अछाम',
  Baitadi: 'बैतडी',
  Bajura: 'बाजुरा',
  Dadeldhura: 'डडेलधुरा',
  Darchula: 'दार्चुला',
  Doti: 'डोटी',
  Kailali: 'कैलाली',
  Kanchanpur: 'कंचनपुर',
} as const;

/**
 * @param useDevanagari — true when admin (or app) language is Nepali or Hindi
 */
export function getNepalGeographyDisplayName(
  nameEn: string,
  useDevanagari: boolean
): string {
  if (!useDevanagari) return nameEn;
  return NEPAL_GEO_DEVANAGARI_BY_EN[nameEn] ?? nameEn;
}
