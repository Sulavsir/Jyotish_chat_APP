/**
 * Email Service - SMTP Email Integration using Nodemailer
 */

import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private initializationAttempted: boolean = false;

  /**
   * Lazy initialization
   */
  private ensureInitialized() {
    // Only initialize once
    if (this.initializationAttempted) {
      return;
    }

    this.initializationAttempted = true;
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Use production-specific env vars in production, regular ones in development
    const smtpHost = isDevelopment
      ? process.env.SMTP_HOST?.trim()
      : process.env.SMTP_HOST_PROD?.trim() || process.env.SMTP_HOST?.trim();
    const smtpPort = isDevelopment
      ? process.env.SMTP_PORT
        ? parseInt(process.env.SMTP_PORT.trim())
        : 587
      : process.env.SMTP_PORT_PROD
        ? parseInt(process.env.SMTP_PORT_PROD.trim())
        : process.env.SMTP_PORT
          ? parseInt(process.env.SMTP_PORT.trim())
          : 587;
    const smtpUser = isDevelopment
      ? process.env.SMTP_USER?.trim()
      : process.env.SMTP_USER_PROD?.trim() || process.env.SMTP_USER?.trim();
    const smtpPassword = isDevelopment
      ? process.env.SMTP_PASSWORD?.trim()
      : process.env.SMTP_PASSWORD_PROD?.trim() || process.env.SMTP_PASSWORD?.trim();

    // Check if SMTP is configured
    if (!smtpHost || !smtpUser || !smtpPassword) {
      // Only log warnings in development
      if (isDevelopment) {
        console.warn('⚠️ SMTP not configured. Email sending will be logged only.');
        console.warn('SMTP Configuration check:', {
          hasHost: !!smtpHost,
          hasUser: !!smtpUser,
          hasPassword: !!smtpPassword,
          host: smtpHost || 'missing',
          user: smtpUser || 'missing',
        });
      }
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      this.isConfigured = true;
      // Only log success in development
      if (isDevelopment) {
        console.log('✅ Email service initialized with SMTP');
      }
    } catch (error) {
      // Only log errors in development
      if (isDevelopment) {
        console.error('❌ Failed to initialize email service:', error);
      }
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // Lazy initialization - ensure transporter is initialized before sending
    this.ensureInitialized();

    // If not configured, just log the email (only in development)
    if (!this.isConfigured || !this.transporter) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [MOCK] Email would be sent:', {
          to,
          subject,
          html: html.substring(0, 100) + '...',
        });
      }
      return true; // Return success for development
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Chat Jyotishi" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html,
      });

      // Only log success in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Email sent successfully:', {
          to,
          subject,
          messageId: info.messageId,
        });
      }

      return true;
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to send email:', error);
      }
      throw error;
    }
  }

  /**
   * Send astrologer registration approval email
   */
  async sendRegistrationApprovalEmail(
    astrologerName: string,
    email: string,
    category: string,
    appointmentFee?: number | null
  ): Promise<boolean> {
    const subject = 'Your Astrologer Registration Has Been Approved - Chat Jyotishi';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🌟 Registration Approved!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Namaste <strong>${astrologerName}</strong>,</p>
            <p style="font-size: 16px;">We are delighted to inform you that your astrologer registration request has been <strong style="color: #10b981;">approved</strong>!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #667eea;">Your Account Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                  <strong>Category:</strong> ${category}
                </li>
                ${appointmentFee ? `<li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Appointment Fee:</strong> Rs. ${appointmentFee}</li>` : ''}
                <li style="padding: 8px 0;">
                  <strong>Status:</strong> <span style="color: #10b981;">Active</span>
                </li>
              </ul>
            </div>

            <p style="font-size: 16px;">You can now log in to your account and start providing consultations to clients.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jyotish/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Login to Your Account
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">If you have any questions, please contact our support team.</p>
            <p style="font-size: 14px; color: #666;">Best regards,<br><strong>Chat Jyotishi Team</strong></p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send astrologer registration rejection email
   */
  async sendRegistrationRejectionEmail(
    astrologerName: string,
    email: string,
    rejectionReason: string
  ): Promise<boolean> {
    const subject = 'Astrologer Registration Update - Chat Jyotishi';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📋 Registration Update</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Namaste <strong>${astrologerName}</strong>,</p>
            <p style="font-size: 16px;">Thank you for your interest in joining Chat Jyotishi as an astrologer.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #d97706;">Registration Status:</h3>
              <p style="color: #dc2626; font-weight: bold;">Your registration request has been reviewed and unfortunately, we are unable to approve it at this time.</p>
              ${
                rejectionReason
                  ? `
                <div style="margin-top: 15px; padding: 15px; background: #fef3c7; border-radius: 5px;">
                  <strong>Reason:</strong>
                  <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
                </div>
              `
                  : ''
              }
            </div>

            <p style="font-size: 16px;">If you believe this decision was made in error, or if you have additional information to provide, please contact our support team for further assistance.</p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">We appreciate your understanding.</p>
            <p style="font-size: 14px; color: #666;">Best regards,<br><strong>Chat Jyotishi Team</strong></p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send appointment reminder email (e.g. 1 hour before). Used for Book Appointment and Full Kundali Review.
   * No coins, money, or commission. Contains: client name, time, website link.
   */
  async sendAppointmentReminderEmail(
    recipientName: string,
    recipientEmail: string,
    options: {
      appointmentTypeLabel: string;
      clientName: string;
      scheduledAt: Date;
      durationMinutes: number;
    }
  ): Promise<boolean> {
    const { appointmentTypeLabel, clientName, scheduledAt, durationMinutes } = options;
    const websiteUrl = process.env.FRONTEND_URL;
    const scheduledFormatted = scheduledAt.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Reminder: ${appointmentTypeLabel} in 1 hour - Chat Jyotishi`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📅 Appointment Reminder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Namaste <strong>${recipientName}</strong>,</p>
            <p style="font-size: 16px;">This is a reminder that your <strong>${appointmentTypeLabel}</strong> is scheduled in about 1 hour.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Client:</strong> ${clientName}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Date & time:</strong> ${scheduledFormatted}</li>
                <li style="padding: 8px 0;"><strong>Duration:</strong> ${durationMinutes} min</li>
              </ul>
            </div>

            <p style="font-size: 16px;">Please be ready to join at the scheduled time.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${websiteUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Open Chat Jyotishi
              </a>
            </div>

            <p style="font-size: 14px; color: #666;">Best regards,<br><strong>Chat Jyotishi Team</strong></p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({ to: recipientEmail, subject, html });
  }
}

// Export singleton instance
export const emailService = new EmailService();
