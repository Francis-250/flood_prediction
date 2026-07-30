"use server";

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
    connectionTimeout: 2500,
    greetingTimeout: 2500,
    socketTimeout: 3000,
  });
}

const fromName = process.env.SMTP_FROM_NAME || "Rwanda Flood Guard";
const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@floodguard.rw";

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  return sendVerificationOtpEmail(email, token);
}

export async function sendVerificationOtpEmail(email: string, otp: string) {
  const trans = transport();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0d9488; color: white; padding: 22px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Rwanda Flood Guard</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Account Verification Code (OTP)</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6; text-align: center;">
        <p style="font-size: 15px; text-align: left;">Hello,</p>
        <p style="font-size: 14px; text-align: left;">Your email verification code for Rwanda Flood Guard is:</p>
        <div style="margin: 28px 0; background-color: #f1f5f9; border: 2px dashed #0d9488; padding: 18px; border-radius: 8px; display: inline-block;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 10px;">Enter this 6-digit OTP code on the verification page to activate your account.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: left;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  if (!trans) {
    console.log(`[Nodemailer OTP Simulation] Verification OTP code for ${email}: ${otp}`);
    return true;
  }

  try {
    await trans.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Your Verification Code: ${otp} - Rwanda Flood Guard`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification OTP email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  return sendPasswordResetOtpEmail(email, token);
}

export async function sendPasswordResetOtpEmail(email: string, otp: string) {
  const trans = transport();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0284c7; color: white; padding: 22px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Rwanda Flood Guard</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Code (OTP)</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6; text-align: center;">
        <p style="font-size: 15px; text-align: left;">Hello,</p>
        <p style="font-size: 14px; text-align: left;">We received a request to reset your password. Use the following 6-digit OTP code:</p>
        <div style="margin: 28px 0; background-color: #f0f9ff; border: 2px dashed #0284c7; padding: 18px; border-radius: 8px; display: inline-block;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0369a1; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 10px;">This code is valid for 15 minutes.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: left;">If you did not request a password reset, please ignore this email.</p>
      </div>
    </div>
  `;

  if (!trans) {
    console.log(`[Nodemailer OTP Simulation] Password Reset OTP code for ${email}: ${otp}`);
    return true;
  }

  try {
    await trans.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Your Password Reset OTP: ${otp} - Rwanda Flood Guard`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset OTP email:", error);
    return false;
  }
}

export async function sendEmergencyAlertEmail(
  userEmails: string[],
  districtName: string,
  province: string,
  riskLevel: string,
  message: string,
  simulated: boolean
) {
  if (userEmails.length === 0) return true;

  const trans = transport();
  const titlePrefix = simulated ? "[SIMULATED DRILL]" : "🚨 CRITICAL FLOOD WARNING";
  const subject = `${titlePrefix} - ${districtName} District (${riskLevel} RISK)`;

  const riskColor =
    riskLevel === "HIGH"
      ? "#e11d48"
      : riskLevel === "MEDIUM"
      ? "#d97706"
      : "#059669";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${riskColor}; color: white; padding: 22px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">Rwanda Flood Early Warning System</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          ${simulated ? "TEST SIMULATION DRILL" : "OFFICIAL PUBLIC EMERGENCY BROADCAST"}
        </p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <div style="background-color: #f8fafc; border-left: 4px solid ${riskColor}; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
          <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 18px;">${districtName} District (${province} Province)</h2>
          <span style="display: inline-block; background-color: ${riskColor}; color: white; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 9999px;">
            ${riskLevel} FLOOD RISK
          </span>
        </div>
        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">Official Emergency Instructions:</p>
        <div style="font-size: 14px; color: #334155; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; font-weight: 500; line-height: 1.6;">
          ${message}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Dispatched via Rwanda Flood Guard Emergency Broadcast Network to all residents in ${districtName} District.
        </p>
      </div>
    </div>
  `;

  if (!trans) {
    console.log(`[Nodemailer Emergency Simulation] Alert sent to ${userEmails.length} recipients in ${districtName}:`, {
      subject,
      recipients: userEmails,
    });
    return true;
  }

  try {
    await trans.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmails.join(", "),
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send emergency alert emails via Nodemailer:", error);
    return false;
  }
}
