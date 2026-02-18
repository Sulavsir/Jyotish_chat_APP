/**
 * SMS Service - Aakash SMS Integration
 * API Documentation: https://sms.aakashsms.com/sms/v3/send
 */

import axios from 'axios';

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
    return process.env.SMS_AUTH_TOKEN || '';
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
   * Only sends SMS in production
   * In development, SMS is skipped and OTP is returned in API response for testing
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // In development, skip SMS sending - OTP will be returned in API response
    if (!this.isProduction) {
      return true; // Return success so OTP flow continues
    }

    // Production: Send actual SMS via Aakash SMS API
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Validate auth token
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('SMS_AUTH_TOKEN is not configured');
      }

      // Prepare request
      const requestData: SendSMSRequest = {
        auth_token: authToken,
        to: formattedPhone,
        text: message,
      };

      console.log('📱 Sending SMS to Aakash API:', {
        url: this.apiUrl,
        to: formattedPhone,
        messageLength: message.length,
      });

      // Send SMS via Aakash SMS API
      const response = await axios.post<SendSMSResponse>(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      console.log('📱 Aakash SMS Response:', {
        error: response.data.error,
        success: response.data.success,
        message: response.data.message,
      });

      // Aakash SMS returns { error: false } on success, { error: true } on failure
      if (!response.data.error) {
        console.log(`✅ SMS sent successfully to ${formattedPhone}`);
        return true;
      } else {
        const errorMsg = `❌ SMS failed: ${response.data.message || 'Unknown error'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        };
        console.error('❌ SMS API Error:', errorDetails);
        throw new Error(`Failed to send SMS: ${errorDetails.message || 'Network error'}`);
      }
      console.error('❌ SMS Error:', error);
      throw error instanceof Error ? error : new Error('Failed to send SMS');
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const message = `Your Chat Jyotishi verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send welcome SMS
   */
  async sendWelcome(phoneNumber: string, name: string): Promise<boolean> {
    const message = `Namaste ${name}! Welcome to Chat Jyotishi. Your cosmic journey begins now. For support, visit our website.`;
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
    const message = `Reminder: Your consultation with ${astrologerName} is scheduled for ${dateTime}. Chat Jyotishi`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send notification
   */
  async sendNotification(phoneNumber: string, text: string): Promise<boolean> {
    return this.sendSMS(phoneNumber, `${text} - Chat Jyotishi`);
  }
}

// Export singleton instance
export const smsService = new SMSService();
