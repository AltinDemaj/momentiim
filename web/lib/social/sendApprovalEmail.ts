import nodemailer from 'nodemailer';
import { getAdminAllowlist } from '@/lib/admin/access';
import { approvalUrl } from '@/lib/social/approvalToken';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are required for social emails');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export interface SocialApprovalEmailInput {
  draftId: string;
  roomContextLabel: string;
  mockupBuffer: Buffer;
  templateLabel: string;
  templateCategory: string;
}

export async function sendSocialApprovalEmail(input: SocialApprovalEmailInput): Promise<void> {
  const recipients = getAdminAllowlist();
  if (recipients.length === 0) {
    throw new Error('ADMIN_EMAILS must include at least one address');
  }

  const approveUrl = approvalUrl(input.draftId, 'approve');
  const rejectUrl = approvalUrl(input.draftId, 'reject');
  const adminUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/admin/social`;

  const transporter = getTransporter();
  const from = process.env.GMAIL_FROM ?? process.env.GMAIL_USER!;

  await transporter.sendMail({
    from: `"Momenti Im" <${from}>`,
    to: recipients.join(', '),
    subject: `📸 Momenti Im — ${input.templateLabel} (${input.roomContextLabel})`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; color: #111;">
        <h2 style="margin: 0 0 8px;">Social draft ready</h2>
        <p style="color: #555; margin: 0 0 8px;">
          <strong>Template:</strong> ${input.templateCategory}<br/>
          <strong>Variant:</strong> ${input.templateLabel}<br/>
          <strong>Room:</strong> ${input.roomContextLabel}
        </p>
        <p style="color: #555; margin: 0 0 20px;">
          Educational mockup for today's TikTok / Instagram post.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${approveUrl}" style="display:inline-block;background:#C9A96E;color:#111;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:12px;">Approve</a>
          <a href="${rejectUrl}" style="display:inline-block;background:#333;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Delete</a>
        </p>
        <p style="font-size: 13px; color: #888;">
          Or open the <a href="${adminUrl}">admin social queue</a> to download and post manually.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `momentiim-social-${input.draftId.slice(0, 8)}.png`,
        content: input.mockupBuffer,
        contentType: 'image/png',
        cid: 'social-mockup',
      },
    ],
  });
}
