const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function buildEmailShell({ title, headline, body, highlight }) {
  return `
    <div style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,Helvetica,sans-serif;color:#f5f7ff;">
      <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
        <div style="background:linear-gradient(180deg,rgba(59,91,255,0.18),rgba(255,255,255,0.04));border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,0.35);">
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:18px;">
            <div style="width:14px;height:14px;border-radius:999px;background:#3b5bff;box-shadow:0 0 18px rgba(59,91,255,0.6);"></div>
            <strong style="font-size:15px;letter-spacing:0.12em;text-transform:uppercase;color:#9db0ff;">NexAI Solutions</strong>
          </div>
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;">${escapeHtml(headline)}</h1>
          <p style="margin:0 0 18px;color:rgba(245,247,255,0.78);font-size:15px;line-height:1.7;">${body}</p>
          ${highlight ? `<div style="margin:22px 0;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:14px;line-height:1.7;">${highlight}</div>` : ''}
          <p style="margin:24px 0 0;color:rgba(245,247,255,0.62);font-size:13px;line-height:1.6;">This message was sent by the NexAI Solutions backend automation system.</p>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `NexAI Solutions <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  });
}

function buildAdminLeadEmail(lead) {
  const title = `New Lead from ${escapeHtml(lead.name)} — ${escapeHtml(lead.service)}`;
  const highlight = `
    <strong style="display:block;color:#f5f7ff;margin-bottom:8px;">Lead Details</strong>
    <div><strong>Name:</strong> ${escapeHtml(lead.name)}</div>
    <div><strong>Email:</strong> ${escapeHtml(lead.email)}</div>
    <div><strong>Service:</strong> ${escapeHtml(lead.service)}</div>
    <div><strong>Status:</strong> ${escapeHtml(lead.status)}</div>
    <div style="margin-top:10px;"><strong>Message:</strong><br>${escapeHtml(lead.message).replace(/\n/g, '<br>')}</div>
  `;

  return {
    subject: `New Lead from ${lead.name} — ${lead.service}`,
    html: buildEmailShell({
      title,
      headline: 'You have a new lead inquiry',
      body: 'A new contact form submission has arrived through the NexAI Solutions website. Review the details below and follow up promptly.',
      highlight
    }),
    text: `New lead from ${lead.name} (${lead.email}) for ${lead.service}. Message: ${lead.message}`
  };
}

function buildUserReplyEmail(lead) {
  return {
    subject: 'Thanks for contacting NexAI Solutions',
    html: buildEmailShell({
      title: 'Thanks for contacting NexAI Solutions',
      headline: 'Thanks for reaching out',
      body: 'We have received your inquiry and our team will respond within 24 hours. We appreciate the opportunity to help with your project.',
      highlight: `
        <div><strong>Name:</strong> ${escapeHtml(lead.name)}</div>
        <div><strong>Service Requested:</strong> ${escapeHtml(lead.service)}</div>
      `
    }),
    text: `Thanks for contacting NexAI Solutions, ${lead.name}. We will respond within 24 hours.`
  };
}

module.exports = {
  sendEmail,
  buildAdminLeadEmail,
  buildUserReplyEmail
};