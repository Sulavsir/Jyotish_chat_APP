/**
 * SMS Service - Aakash SMS Integration
 * API Documentation: https://sms.aakashsms.com/sms/v3/send
 */

import axios from 'axios';
import { encrypt, maskPhone } from '../utils';

interface SendSMSRequest {
  auth_token: string;
  to: string; // Comma-separated phone numbers
  text: string;
}

interface SendSMSResponse {
  error: boolean;
  success?: boolean;
  message?: string;
  data?: Array<Record<string, unknown>>;
}

class SMSService {
  private apiUrl: string;
  private isProduction: boolean;

  constructor() {
    this.apiUrl = process.env.SMS_API_URL || 'https://sms.aakashsms.com/sms/v3/send';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Lazy-load auth token at runtime instead of constructor
  private getAuthToken(): string {
    //to do change this to the actual auth token
    // return process.env.SMS_AUTH_TOKEN || '';
    return '';
  }

  private formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');

    // If has 977 prefix, remove it to get 10-digit number
    if (cleanPhone.startsWith('977') && cleanPhone.length === 13) {
      return cleanPhone.slice(3); // Remove 977 prefix
    }

    // Validate 10-digit Nepali number
    if (cleanPhone.match(/^(98|97)\d{8}$/)) {
      return cleanPhone; // Return as-is (10 digits)
    }

    throw new Error('Invalid Nepali phone number format');
  }

  /**
   * Send SMS via Aakash SMS API
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Log in development for debugging
      if (!this.isProduction) {
        console.log('\n📱 ===== SMS (Development Mode) =====');
        console.log(`To: ${formattedPhone}`);
        console.log(`Message: ${message}`);
        console.log('=====================================\n');
      }

      // Validate auth token
      const authToken = this.getAuthToken();
      if (!authToken) {
        console.warn('⚠️  SMS_AUTH_TOKEN not configured - SMS not sent');
        return !this.isProduction; // Return true in dev (logged only), false in prod
      }

      // Prepare request
      const requestData: SendSMSRequest = {
        auth_token: authToken,
        to: formattedPhone,
        text: message,
      };

      // Send SMS via Aakash SMS API
      console.log('Sending SMS to Aakash API:', {
        url: this.apiUrl,
        to: formattedPhone,
        messageLength: message.length,
      });

      const response = await axios.post<SendSMSResponse>(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      console.log('Aakash SMS Response:', response.data);

      // Aakash SMS returns { error: false } on success, { error: true } on failure
      if (!response.data.error) {
        console.log(`✅ SMS sent successfully to ${maskPhone(formattedPhone)}`);
        return true;
      } else {
        console.error(`❌ SMS failed: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('SMS API Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
      } else {
        console.error('SMS Error:', error);
      }

      // In production, throw error; in development, just log
      if (this.isProduction) {
        throw new Error('Failed to send SMS');
      }
      return false;
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const message = `Your Chat Jyotish verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send welcome SMS
   */
  async sendWelcome(phoneNumber: string, name: string): Promise<boolean> {
    const message = `Namaste ${name}! Welcome to Chat Jyotish. Your cosmic journey begins now. For support, visit our website.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send consultation reminder
   */
  async sendConsultationReminder(
    phoneNumber: string,
    astrologerName: string,
    dateTime: string
  ): Promise<boolean> {
    const message = `Reminder: Your consultation with ${astrologerName} is scheduled for ${dateTime}. Chat Jyotish`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send notification
   */
  async sendNotification(phoneNumber: string, text: string): Promise<boolean> {
    return this.sendSMS(phoneNumber, `${text} - Chat Jyotish`);
  }
}

// Export singleton instance
export const smsService = new SMSService();
