// src/services/email.service.ts
// ── Email service using Resend — all transactional emails

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "D.D. Onietan & Co. <noreply@ddonietanandco.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "info@ddonietanandco.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ddonietanandco.com";

// ── Branded email wrapper
const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>D.D. Onietan & Co.</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:32px 40px;text-align:center;">
            <p style="color:#D4AF37;font-family:Georgia,serif;font-size:20px;font-weight:bold;margin:0;letter-spacing:1px;">D.D. ONIETAN (S.A.N) & CO.</p>
            <p style="color:#E8D6A7;font-size:11px;letter-spacing:3px;margin:6px 0 0;font-family:Arial,sans-serif;text-transform:uppercase;">Barristers & Solicitors</p>
          </td>
        </tr>
        <!-- Gold divider -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#D4AF37,#8B7536,#D4AF37);"></td></tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f0;padding:24px 40px;border-top:1px solid #e8d6a7;text-align:center;">
            <p style="color:#888;font-size:12px;font-family:Arial,sans-serif;margin:0;">
              D.D. Onietan (SAN) & Co. · Barristers & Solicitors<br/>
              Plot 14B, Adetokunbo Ademola Crescent, Wuse II, Abuja, FCT, Nigeria<br/>
              <a href="https://ddonietanandco.com" style="color:#D4AF37;">www.ddonietanandco.com</a> | info@ddonietanandco.com
            </p>
            <p style="color:#aaa;font-size:10px;margin:12px 0 0;font-family:Arial,sans-serif;">
              This email is confidential and intended solely for the addressee. If you have received this email in error, please notify us immediately.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const h1 = (text: string) => `<h1 style="font-family:Georgia,serif;color:#1a1a1a;font-size:24px;margin:0 0 16px;">${text}</h1>`;
const p = (text: string) => `<p style="color:#444;font-size:15px;line-height:1.7;font-family:Arial,sans-serif;margin:0 0 16px;">${text}</p>`;
const btn = (text: string, href: string) => `<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#D4AF37;color:#000;padding:14px 32px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;border-radius:2px;display:inline-block;">${text}</a></div>`;
const divider = () => `<hr style="border:none;border-top:1px solid #e8d6a7;margin:24px 0;"/>`;
const label = (k: string, v: string) => `<tr><td style="padding:8px 0;color:#888;font-size:13px;font-family:Arial;width:160px;">${k}</td><td style="padding:8px 0;color:#222;font-size:13px;font-family:Arial;">${v}</td></tr>`;

export const emailService = {
  // ── EMAIL VERIFICATION
  async sendEmailVerification({ to, name, token }: { to: string; name: string; token: string }) {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: "Verify Your Email — D.D. Onietan & Co.",
      html: emailTemplate(`
        ${h1("Welcome to D.D. Onietan & Co.")}
        ${p(`Dear ${name},`)}
        ${p("Thank you for registering with our client portal. Please verify your email address to activate your account and gain access to your legal dashboard.")}
        ${btn("Verify Email Address", verifyUrl)}
        ${p("This verification link will expire in 24 hours. If you did not create an account, please disregard this email.")}
      `),
    });
  },

  // ── PASSWORD RESET
  async sendPasswordReset({ to, name, token }: { to: string; name: string; token: string }) {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: "Password Reset Request — D.D. Onietan & Co.",
      html: emailTemplate(`
        ${h1("Password Reset Request")}
        ${p(`Dear ${name},`)}
        ${p("We received a request to reset the password for your account. Click the button below to set a new password:")}
        ${btn("Reset My Password", resetUrl)}
        ${p("This link will expire in 1 hour. If you did not request a password reset, please contact us immediately at <strong>info@ddonietanandco.com</strong>.")}
      `),
    });
  },

  // ── CONSULTATION ACKNOWLEDGEMENT
  async sendConsultationAcknowledgement({ to, name, service, preferredDate, preferredTime }: {
    to: string; name: string; service: string; preferredDate?: string; preferredTime?: string;
  }) {
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: "Consultation Request Received — D.D. Onietan & Co.",
      html: emailTemplate(`
        ${h1("Thank You for Your Consultation Request")}
        ${p(`Dear ${name},`)}
        ${p("We have received your consultation request. A member of our team will review your inquiry and contact you within <strong>24 business hours</strong>.")}
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${label("Service Required:", service)}
          ${label("Preferred Date:", preferredDate ?? "To be confirmed")}
          ${label("Preferred Time:", preferredTime ?? "To be confirmed")}
        </table>
        ${divider()}
        ${p("In the meantime, if you have an urgent legal matter, please call us directly at <strong>+234 803 XXX XXXX</strong>.")}
        ${p("We look forward to serving you.")}
      `),
    });
  },

  // ── APPOINTMENT CONFIRMATION
  async sendAppointmentConfirmation({ to, clientName, lawyerName, scheduledAt, duration, subject, status, meetingLink }: {
    to: string; clientName: string; lawyerName: string; scheduledAt: Date; duration: number;
    subject: string; status: string; meetingLink?: string;
  }) {
    const statusLabel: Record<string, string> = {
      PENDING: "Pending Confirmation", CONFIRMED: "Confirmed", RESCHEDULED: "Rescheduled",
    };
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: `Appointment ${statusLabel[status] ?? status} — D.D. Onietan & Co.`,
      html: emailTemplate(`
        ${h1(`Appointment ${statusLabel[status] ?? status}`)}
        ${p(`Dear ${clientName},`)}
        ${p(`Your appointment with <strong>${lawyerName}</strong> has been ${status.toLowerCase()}.`)}
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${label("Subject:", subject)}
          ${label("Lawyer:", lawyerName)}
          ${label("Date:", scheduledAt.toDateString())}
          ${label("Time:", scheduledAt.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }))}
          ${label("Duration:", `${duration} minutes`)}
          ${meetingLink ? label("Meeting Link:", `<a href="${meetingLink}" style="color:#D4AF37;">${meetingLink}</a>`) : label("Location:", "D.D. Onietan & Co. Office, Wuse II, Abuja")}
        </table>
        ${divider()}
        ${p("Please arrive 10 minutes early for in-person appointments. To reschedule or cancel, please contact us at least 24 hours in advance.")}
      `),
    });
  },

  // ── CASE UPDATE
  async sendCaseUpdate({ to, clientName, caseNumber, caseTitle, update }: {
    to: string; clientName: string; caseNumber: string; caseTitle: string; update: string;
  }) {
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: `Case Update: ${caseNumber} — D.D. Onietan & Co.`,
      html: emailTemplate(`
        ${h1("Case Update")}
        ${p(`Dear ${clientName},`)}
        ${p(`There is a new update on your case <strong>${caseNumber}: ${caseTitle}</strong>.`)}
        ${divider()}
        <div style="background:#f9f6f0;border-left:4px solid #D4AF37;padding:20px 24px;border-radius:0 4px 4px 0;">
          <p style="color:#333;font-size:14px;font-family:Arial,sans-serif;margin:0;line-height:1.7;">${update}</p>
        </div>
        ${divider()}
        ${btn("View Case in Portal", `${APP_URL}/client/cases`)}
        ${p("For any questions, please do not hesitate to contact your assigned lawyer.")}
      `),
    });
  },

  // ── INVOICE
  async sendInvoice({ to, clientName, invoiceNumber, totalAmount, dueDate, caseTitle }: {
    to: string; clientName: string; invoiceNumber: string; totalAmount: number; dueDate: Date; caseTitle?: string;
  }) {
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: `Invoice ${invoiceNumber} — D.D. Onietan & Co.`,
      html: emailTemplate(`
        ${h1("Invoice")}
        ${p(`Dear ${clientName},`)}
        ${p("Please find below details of your invoice from D.D. Onietan & Co.")}
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${label("Invoice Number:", invoiceNumber)}
          ${caseTitle ? label("Matter:", caseTitle) : ""}
          ${label("Amount Due:", `₦${totalAmount.toLocaleString("en-NG")}`)}
          ${label("Due Date:", dueDate.toDateString())}
        </table>
        ${divider()}
        ${btn("View & Pay Invoice", `${APP_URL}/client/invoices`)}
        ${p("Payment can be made via bank transfer. Bank details are included in your full invoice in the client portal. Please quote your invoice number in the payment reference.")}
      `),
    });
  },

  // ── NEWSLETTER WELCOME
  async sendNewsletterWelcome({ to, name }: { to: string; name: string }) {
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: "Welcome to Our Newsletter — D.D. Onietan & Co.",
      html: emailTemplate(`
        ${h1("Welcome to Our Legal Insights Newsletter")}
        ${p(`Dear ${name},`)}
        ${p("Thank you for subscribing to the D.D. Onietan & Co. newsletter. You will receive our latest legal insights, publications, and firm updates directly in your inbox.")}
        ${p("Our team of distinguished legal professionals regularly publishes articles on Nigerian law, landmark judgments, and developments across all major practice areas.")}
        ${divider()}
        ${btn("Read Our Latest Publications", `${APP_URL}/#publications`)}
      `),
    });
  },

  // ── CONTACT AUTO-REPLY
  async sendContactAutoReply({ to, name, subject }: { to: string; name: string; subject: string }) {
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: `Re: ${subject} — D.D. Onietan & Co.`,
      html: emailTemplate(`
        ${h1("Message Received")}
        ${p(`Dear ${name},`)}
        ${p(`Thank you for contacting D.D. Onietan & Co. We have received your message regarding "<strong>${subject}</strong>" and will respond within <strong>24 business hours</strong>.`)}
        ${p("For urgent matters, please call us at <strong>+234 803 XXX XXXX</strong>.")}
      `),
    });
  },

  // ── WELCOME NEW LAWYER (admin-created account)
  async sendWelcomeLawyer({ to, name, tempPassword }: { to: string; name: string; tempPassword: string }) {
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: "Your Lawyer Portal Account — D.D. Onietan & Co.",
      html: emailTemplate(`
        ${h1("Welcome to the Lawyer Portal")}
        ${p(`Dear ${name},`)}
        ${p("Your lawyer portal account has been created. Please use the credentials below to log in and change your password immediately.")}
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${label("Portal URL:", `<a href="${APP_URL}/lawyer/login" style="color:#D4AF37;">${APP_URL}/lawyer/login</a>`)}
          ${label("Email:", to)}
          ${label("Temp Password:", `<strong>${tempPassword}</strong>`)}
        </table>
        ${divider()}
        ${btn("Access Lawyer Portal", `${APP_URL}/lawyer/login`)}
        ${p("<strong>Important:</strong> Change your password immediately after first login. Do not share these credentials with anyone.")}
      `),
    });
  },

  // ── WELCOME NEW EMPLOYEE (admin-created account, any staff role)
  // Generic version of sendWelcomeLawyer for non-lawyer staff roles
  // (Managing Partner, Legal Assistant, Secretary, Receptionist,
  // Finance Officer) — same credential-delivery pattern, role-aware copy.
  async sendWelcomeEmployee({ to, name, tempPassword, role }: { to: string; name: string; tempPassword: string; role: string }) {
    const roleLabel = role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    await resend.emails.send({
      from: FROM, to, reply_to: REPLY_TO,
      subject: `Your ${roleLabel} Account — D.D. Onietan & Co.`,
      html: emailTemplate(`
        ${h1(`Welcome to D.D. Onietan & Co.`)}
        ${p(`Dear ${name},`)}
        ${p(`Your staff account has been created with the role of <strong>${roleLabel}</strong>. Please use the credentials below to log in and change your password immediately.`)}
        ${divider()}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${label("Portal URL:", `<a href="${APP_URL}/login" style="color:#D4AF37;">${APP_URL}/login</a>`)}
          ${label("Email:", to)}
          ${label("Temp Password:", `<strong>${tempPassword}</strong>`)}
        </table>
        ${divider()}
        ${btn("Access Staff Portal", `${APP_URL}/login`)}
        ${p("<strong>Important:</strong> Change your password immediately after first login. Do not share these credentials with anyone.")}
      `),
    });
  },

  // ── INTERNAL ADMIN ALERT
  async sendInternalAlert({ subject, body }: { subject: string; body: string }) {
    await resend.emails.send({
      from: FROM,
      to: process.env.FIRM_EMAIL ?? "info@ddonietanandco.com",
      subject: `[INTERNAL] ${subject}`,
      html: emailTemplate(`
        ${h1("Internal Notification")}
        <pre style="background:#f5f0e8;padding:20px;border-radius:4px;font-family:monospace;font-size:13px;color:#333;white-space:pre-wrap;">${body}</pre>
      `),
    });
  },
};
