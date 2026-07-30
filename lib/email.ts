import "server-only";
import nodemailer from "nodemailer";

function transport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
}

const fromName = process.env.SMTP_FROM_NAME || "Rwanda Flood Guard";
const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@floodguard.rw";

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  const trans = transport();
  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 8px; overflow: hidden;">
      <div style="background-color: #0d9488; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Rwanda Flood Guard</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Verify Your Email Address</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p>Hello,</p>
        <p>Thank you for registering on the Rwanda Flood Prediction System. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verifyUrl}" style="background-color: #0d9488; color: white; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link in your browser: <br/><a href="${verifyUrl}" style="color: #0d9488;">${verifyUrl}</a></p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">If you did not request this email, please ignore it.</p>
      </div>
    </div>
  `;

  if (!trans) {
    console.log(`[Email Simulation] Verification link for ${email}: ${verifyUrl}`);
    return true;
  }

  try {
    await trans.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Verify Your Account - Rwanda Flood Guard",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const trans = transport();
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 8px; overflow: hidden;">
      <div style="background-color: #0284c7; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Rwanda Flood Guard</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p>Hello,</p>
        <p>We received a request to reset your password for your Rwanda Flood Guard account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link in your browser: <br/><a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a></p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  if (!trans) {
    console.log(`[Email Simulation] Password reset link for ${email}: ${resetUrl}`);
    return true;
  }

  try {
    await trans.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Reset Your Password - Rwanda Flood Guard",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
