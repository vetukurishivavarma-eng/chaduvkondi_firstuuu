import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// Only initialize Resend if API key is available (for dev mode without email)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Resend requires domain verification for custom senders.
// For development/testing, onboarding@resend.dev works out of the box.
// In production, verify your domain and set RESEND_FROM_EMAIL.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Chaduvkondi <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<{ success: boolean; message: string }> {
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

  if (!resend) {
    // Dev mode fallback — log the link instead of sending
    console.log("═══════════════════════════════════════════");
    console.log("🔐 [DEV MODE] Password Reset Link:");
    console.log(`   To: ${to}`);
    console.log(`   Link: ${resetLink}`);
    console.log("═══════════════════════════════════════════");
    return {
      success: true,
      message: `[DEV MODE] Reset link logged to console. In production, this would be emailed to ${to}.`,
    };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your Chaduvkondi password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center; }
            .header h1 { color: white; font-size: 24px; margin: 0; font-weight: 700; }
            .body { padding: 32px 24px; }
            .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0; }
            .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
            .expiry { color: #6b7280; font-size: 13px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="body">
              <p>Hi there,</p>
              <p>We received a request to reset the password for your Chaduvkondi account. Click the button below to set a new password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="btn">Reset Password</a>
              </div>
              <p class="expiry">This link will expire in 1 hour.</p>
              <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>Chaduvkondi — Master any programming language</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Failed to send password reset email:", error);
      return { success: false, message: "Failed to send email. Please try again later." };
    }

    console.log(`[Resend] Password reset email sent to ${to}`);
    return { success: true, message: "Password reset email sent successfully." };
  } catch (err) {
    console.error("[Resend] Error sending email:", err);
    return { success: false, message: "Failed to send email. Please try again later." };
  }
}
