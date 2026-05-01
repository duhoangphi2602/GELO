import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendOtp(
    email: string,
    code: string,
    type: 'REGISTER' | 'FORGOT_PASSWORD' | 'CHANGE_PASSWORD',
  ) {
    let subject = 'Your GELO Verification Code';
    let title = 'Verification Code';
    let message = 'Please use the verification code below:';

    if (type === 'REGISTER') {
      subject = 'Welcome to GELO - Verify your email';
      title = 'Verify Your Email';
      message =
        'Thank you for registering with GELO! Please use the following OTP to verify your email address. This code is valid for 5 minutes.';
    } else if (type === 'FORGOT_PASSWORD') {
      subject = 'GELO - Password Reset Request';
      title = 'Reset Your Password';
      message =
        'We received a request to reset your password. Please use the following OTP to proceed. If you did not request this, please ignore this email. This code is valid for 5 minutes.';
    } else if (type === 'CHANGE_PASSWORD') {
      subject = 'GELO - Change Password Request';
      title = 'Change Your Password';
      message =
        'You have requested to change your password. Please use the following OTP to authorize this action. This code is valid for 5 minutes.';
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2a64ad; margin: 0;">GELO Healthcare</h2>
        </div>
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
          <h3 style="color: #334155; margin-top: 0;">${title}</h3>
          <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
            ${message}
          </p>
          <div style="background-color: #ffffff; border: 2px dashed #cbd5e1; padding: 15px; border-radius: 8px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 5px;">${code}</span>
          </div>
        </div>
        <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>This is an automated email, please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} GELO Healthcare. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || '"GELO Healthcare" <noreply@gelo.com>',
        to: email,
        subject,
        html,
      });
      this.logger.log(`OTP email sent to ${email} for ${type}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw new Error('Failed to send verification email');
    }
  }
}
