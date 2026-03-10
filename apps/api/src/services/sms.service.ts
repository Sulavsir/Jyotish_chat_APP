import axios from 'axios';
import { isSmsSendEnabled } from '../utils/env.utils';
import { SMS_DEFAULT_API_URL, SMS_REQUEST_TIMEOUT_MS } from '../constants/sms.constants';
import type { SendSMSResponse } from '../types/sms.types';

class SMSService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.SMS_API_URL || SMS_DEFAULT_API_URL;
  }

  private getAuthToken(): string {
    return process.env.SMS_AUTH_TOKEN || '';
  }

  private formatPhoneNumber(phone: string): string {
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('977') && clean.length === 13) {
      return clean.slice(3);
    }
    if (clean.match(/^(98|97)\d{8}$/)) {
      return clean;
    }
    throw new Error('Invalid Nepali phone number format');
  }

  /**
   * Send SMS via Aakash API. When SMS is disabled (e.g. dev), returns true without sending.
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!isSmsSendEnabled()) {
      return true;
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const authToken = this.getAuthToken();
    if (!authToken) {
      throw new Error('SMS_AUTH_TOKEN is not configured');
    }

    const formBody = new URLSearchParams({
      auth_token: authToken,
      to: formattedPhone,
      text: message,
    }).toString();

    try {
      const response = await axios.post<SendSMSResponse>(this.apiUrl, formBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: SMS_REQUEST_TIMEOUT_MS,
      });

      if (!response.data.error) {
        return true;
      }
      const msg = response.data.message || 'Unknown error';
      throw new Error(msg);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as SendSMSResponse | undefined;
        const msg =
          data?.message ?? (err.response?.data as { message?: string })?.message ?? err.message;
        console.error('SMS send failed:', msg);
        throw new Error(`Failed to send SMS: ${msg}`);
      }
      throw err instanceof Error ? err : new Error('Failed to send SMS');
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const message = `Your Chat Jyotishi verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
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
