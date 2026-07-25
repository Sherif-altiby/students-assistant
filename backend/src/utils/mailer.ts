import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  auth: {
    user: env.mail.user,
    pass: env.mail.pass,
  },
  // Fail fast instead of hanging indefinitely on bad credentials, a
  // blocked port, or an unreachable host.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

/**
 * Email HTML must use inline styles and table-based layout — most email
 * clients (Outlook especially) ignore <style> blocks and modern CSS
 * (flexbox/grid), so this intentionally looks old-fashioned compared to
 * a normal webpage template.
 */
const buildDoctorInvitationHtml = (params: { name: string; invitationLink: string }): string => {
  const { name, invitationLink } = params;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You've been invited</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

            <!-- Header -->
            <tr>
              <td style="background-color:#155e75; padding:32px 40px; text-align:center;">
                <span style="display:inline-block; width:48px; height:48px; background-color:#ffffff; border-radius:50%; line-height:48px; font-size:22px; color:#155e75; font-weight:700;">+</span>
                <h1 style="margin:16px 0 0; color:#ffffff; font-size:20px; font-weight:600;">You're invited to join our platform</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 16px; font-size:16px; color:#1f2937;">Hi Dr. ${name},</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4b5563;">
                  An administrator has created a doctor account for you on our platform.
                  To get started, set your password and activate your account using the button below.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="border-radius:8px; background-color:#0891b2;">
                      <a href="${invitationLink}"
                         style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                        Set Password &amp; Activate Account
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px; font-size:13px; color:#9ca3af; text-align:center;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px; font-size:13px; color:#0891b2; text-align:center; word-break:break-all;">
                  ${invitationLink}
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7; border-radius:8px;">
                  <tr>
                    <td style="padding:14px 16px; font-size:13px; color:#92400e;">
                      ⏳ This invitation link expires in <strong>48 hours</strong>.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 40px; background-color:#f9fafb; text-align:center;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

export const sendDoctorInvitationEmail = async (params: {
  to: string;
  name: string;
  invitationLink: string;
}): Promise<void> => {
  const { to, name, invitationLink } = params;

  console.log(`[mailer] Sending doctor invitation to ${to}...`);

  try {
    const info = await transporter.sendMail({
      from: env.mail.from,
      to,
      subject: "You've been invited as a doctor",
      html: buildDoctorInvitationHtml({ name, invitationLink }),
    });

    console.log('[mailer] Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error) {
    console.error('[mailer] Failed to send email:', error);
    throw error; // rethrow so userService.inviteDoctor still catches it and skips creating the doctor
  }
};