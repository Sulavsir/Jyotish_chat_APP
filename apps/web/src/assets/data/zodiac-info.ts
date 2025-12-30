/**
 * Zodiac Sign Information
 * Static data for all 12 zodiac signs
 */

export interface ZodiacInfo {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  quality: 'Cardinal' | 'Fixed' | 'Mutable';
  ruler: string;
  dates: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  color: string;
  luckyNumbers: number[];
}

export const ZODIAC_DATA: Record<string, ZodiacInfo> = {
  ARIES: {
    name: 'Aries',
    symbol: '♈',
    element: 'Fire',
    quality: 'Cardinal',
    ruler: 'Mars',
    dates: 'March 21 - April 19',
    description: 'The Ram - Bold, ambitious, and fearless',
    strengths: ['Courageous', 'Determined', 'Confident', 'Enthusiastic'],
    weaknesses: ['Impatient', 'Moody', 'Short-tempered', 'Impulsive'],
    color: '#FF6B6B',
    luckyNumbers: [1, 8, 17],
  },
  TAURUS: {
    name: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    quality: 'Fixed',
    ruler: 'Venus',
    dates: 'April 20 - May 20',
    description: 'The Bull - Reliable, patient, and devoted',
    strengths: ['Reliable', 'Patient', 'Practical', 'Devoted'],
    weaknesses: ['Stubborn', 'Possessive', 'Uncompromising'],
    color: '#6BCB77',
    luckyNumbers: [2, 6, 9, 12, 24],
  },
  GEMINI: {
    name: 'Gemini',
    symbol: '♊',
    element: 'Air',
    quality: 'Mutable',
    ruler: 'Mercury',
    dates: 'May 21 - June 20',
    description: 'The Twins - Curious, adaptable, and versatile',
    strengths: ['Gentle', 'Affectionate', 'Curious', 'Adaptable'],
    weaknesses: ['Nervous', 'Inconsistent', 'Indecisive'],
    color: '#FFD93D',
    luckyNumbers: [5, 7, 14, 23],
  },
  CANCER: {
    name: 'Cancer',
    symbol: '♋',
    element: 'Water',
    quality: 'Cardinal',
    ruler: 'Moon',
    dates: 'June 21 - July 22',
    description: 'The Crab - Intuitive, emotional, and protective',
    strengths: ['Tenacious', 'Loyal', 'Emotional', 'Sympathetic'],
    weaknesses: ['Moody', 'Pessimistic', 'Suspicious', 'Manipulative'],
    color: '#95E1D3',
    luckyNumbers: [2, 3, 15, 20],
  },
  LEO: {
    name: 'Leo',
    symbol: '♌',
    element: 'Fire',
    quality: 'Fixed',
    ruler: 'Sun',
    dates: 'July 23 - August 22',
    description: 'The Lion - Creative, passionate, and generous',
    strengths: ['Creative', 'Passionate', 'Generous', 'Cheerful'],
    weaknesses: ['Arrogant', 'Stubborn', 'Self-centered', 'Inflexible'],
    color: '#F38181',
    luckyNumbers: [1, 3, 10, 19],
  },
  VIRGO: {
    name: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    quality: 'Mutable',
    ruler: 'Mercury',
    dates: 'August 23 - September 22',
    description: 'The Virgin - Analytical, practical, and hardworking',
    strengths: ['Loyal', 'Analytical', 'Kind', 'Hardworking'],
    weaknesses: ['Shy', 'Worry', 'Overly critical', 'All work no play'],
    color: '#A8E6CF',
    luckyNumbers: [5, 14, 15, 23, 32],
  },
  LIBRA: {
    name: 'Libra',
    symbol: '♎',
    element: 'Air',
    quality: 'Cardinal',
    ruler: 'Venus',
    dates: 'September 23 - October 22',
    description: 'The Scales - Diplomatic, gracious, and fair-minded',
    strengths: ['Cooperative', 'Diplomatic', 'Gracious', 'Fair-minded'],
    weaknesses: ['Indecisive', 'Avoids confrontations', 'Self-pity'],
    color: '#FFDAB9',
    luckyNumbers: [4, 6, 13, 15, 24],
  },
  SCORPIO: {
    name: 'Scorpio',
    symbol: '♏',
    element: 'Water',
    quality: 'Fixed',
    ruler: 'Pluto',
    dates: 'October 23 - November 21',
    description: 'The Scorpion - Passionate, resourceful, and brave',
    strengths: ['Resourceful', 'Brave', 'Passionate', 'Stubborn'],
    weaknesses: ['Distrusting', 'Jealous', 'Secretive', 'Violent'],
    color: '#8B4513',
    luckyNumbers: [8, 11, 18, 22],
  },
  SAGITTARIUS: {
    name: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    quality: 'Mutable',
    ruler: 'Jupiter',
    dates: 'November 22 - December 21',
    description: 'The Archer - Optimistic, adventurous, and honest',
    strengths: ['Generous', 'Idealistic', 'Great sense of humor'],
    weaknesses: ['Promises more than can deliver', 'Impatient'],
    color: '#9B59B6',
    luckyNumbers: [3, 7, 9, 12, 21],
  },
  CAPRICORN: {
    name: 'Capricorn',
    symbol: '♑',
    element: 'Earth',
    quality: 'Cardinal',
    ruler: 'Saturn',
    dates: 'December 22 - January 19',
    description: 'The Goat - Responsible, disciplined, and self-controlled',
    strengths: ['Responsible', 'Disciplined', 'Self-control', 'Manager'],
    weaknesses: ['Know-it-all', 'Unforgiving', 'Condescending'],
    color: '#34495E',
    luckyNumbers: [4, 8, 13, 22],
  },
  AQUARIUS: {
    name: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    quality: 'Fixed',
    ruler: 'Uranus',
    dates: 'January 20 - February 18',
    description: 'The Water Bearer - Progressive, original, and independent',
    strengths: ['Progressive', 'Original', 'Independent', 'Humanitarian'],
    weaknesses: ['Runs from emotional expression', 'Temperamental'],
    color: '#3498DB',
    luckyNumbers: [4, 7, 11, 22, 29],
  },
  PISCES: {
    name: 'Pisces',
    symbol: '♓',
    element: 'Water',
    quality: 'Mutable',
    ruler: 'Neptune',
    dates: 'February 19 - March 20',
    description: 'The Fish - Compassionate, artistic, and intuitive',
    strengths: ['Compassionate', 'Artistic', 'Intuitive', 'Gentle', 'Wise'],
    weaknesses: ['Fearful', 'Overly trusting', 'Sad', 'Victim mentality'],
    color: '#E8DAEF',
    luckyNumbers: [3, 9, 12, 15, 18, 24],
  },
};

// Helper function to get zodiac info
export function getZodiacInfo(sign: string): ZodiacInfo | undefined {
  return ZODIAC_DATA[sign.toUpperCase()];
}

