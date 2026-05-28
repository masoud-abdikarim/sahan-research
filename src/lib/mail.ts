import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email – Sahan Studies</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(99,102,241,0.10);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Sahan Studies</h1>
              <p style="margin:6px 0 0;color:#c7d2fe;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Academic Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Email Verification</p>
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:700;">Hi ${name},</h2>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">
                Welcome to Sahan Studies! To complete your registration, please use the verification code below. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#f8fafc;border:2px dashed #6366f1;border-radius:14px;padding:22px 44px;text-align:center;margin-bottom:28px;">
                      <p style="margin:0 0 4px;color:#6366f1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
                      <p style="margin:0;color:#1e293b;font-size:42px;font-weight:900;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;color:#475569;font-size:14px;line-height:1.7;">
                Enter this code on the verification page to activate your account.
              </p>
              <p style="margin:0 0 28px;color:#ef4444;font-size:13px;font-weight:600;">
                ⏱ This code expires in 10 minutes.
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding:0 40px 36px;">
              <div style="background:#fef9ec;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                  🔒 <strong>Security Notice:</strong> Sahan Studies will never ask for this code via phone or email. If you did not create an account, please ignore this message.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Sahan Studies. All rights reserved.</p>
              <p style="margin:4px 0 0;color:#cbd5e1;font-size:11px;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  await transporter.sendMail({
    from: `"Sahan Studies" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your Sahan Studies Verification Code",
    html,
  });
}
