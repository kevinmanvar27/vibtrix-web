/**
 * Email utility for sending emails via SMTP (Gmail)
 */
import nodemailer from "nodemailer";
import debug from "./debug";

const isProduction = process.env.NODE_ENV === "production";

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured SMTP server
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Log SMTP configuration only in development (without password)
    if (!isProduction) {
      console.log("=== Email Configuration ===");
      console.log("SMTP_HOST:", process.env.SMTP_HOST || "smtp.gmail.com (default)");
      console.log("SMTP_PORT:", process.env.SMTP_PORT || "587 (default)");
      console.log("SMTP_USER:", process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 5)}...` : "NOT SET");
      console.log("SMTP_PASS:", process.env.SMTP_PASS ? "SET (hidden)" : "NOT SET");
      console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "Vibtrix <noreply@vibtrix.com> (default)");
      console.log("Sending to:", options.to);
      console.log("Subject:", options.subject);
    }
    
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Vibtrix <noreply@vibtrix.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    debug.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    debug.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send password reset OTP email
 */
export async function sendPasswordResetOTP(
  email: string,
  username: string,
  otp: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Vibtrix</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Password Reset Request</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">Hi ${username},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
              We received a request to reset your password. Use the OTP code below to verify your identity:
            </p>
            
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
              <div style="font-size: 36px; font-weight: 700; color: #6366f1; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #9ca3af; font-size: 13px; margin: 15px 0 0;">
                This code expires in <strong>10 minutes</strong>
              </p>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
              Need help? Contact our support team anytime.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 25px 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} Vibtrix. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
    Hi ${username},

    We received a request to reset your password.

    Your OTP Code: ${otp}

    This code expires in 10 minutes.

    If you didn't request this password reset, please ignore this email.

    - Vibtrix Team
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Vibtrix",
    html,
    text,
  });
}

/**
 * Send email verification OTP
 */
export async function sendEmailVerificationOTP(
  email: string,
  username: string,
  otp: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Vibtrix</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Email Verification</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">Hi ${username},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
              Thank you for signing up! Please verify your email address using the OTP code below:
            </p>
            
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <div style="font-size: 36px; font-weight: 700; color: #6366f1; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #9ca3af; font-size: 13px; margin: 15px 0 0;">
                This code expires in <strong>10 minutes</strong>
              </p>
            </div>
            
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <p style="color: #1e40af; font-size: 14px; margin: 0;">
                <strong>Why verify?</strong> Verifying your email helps secure your account and enables important features like password recovery.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
              If you didn't create an account with Vibtrix, please ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 25px 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} Vibtrix. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
    Hi ${username},

    Thank you for signing up! Please verify your email address.

    Your Verification Code: ${otp}

    This code expires in 10 minutes.

    If you didn't create an account with Vibtrix, please ignore this email.

    - Vibtrix Team
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Email - Vibtrix",
    html,
    text,
  });
}

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Vibtrix</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎉 Welcome to Vibtrix!</h1>
          </td>
        </tr>
        <tr>
          <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">Hi ${username},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
              Welcome to Vibtrix! Your account has been created successfully. We're excited to have you join our community.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Get Started
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 25px 30px; text-align: center;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} Vibtrix. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to Vibtrix! 🎉",
    html,
  });
}
