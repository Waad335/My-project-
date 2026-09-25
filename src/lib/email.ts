// Transactional email via Resend's HTTP API (no SDK dependency). When
// RESEND_API_KEY / EMAIL_FROM aren't configured nothing is sent: in
// development the plain-text body is logged so flows like password reset can
// still be exercised locally; in production only a warning is logged, never
// the body (it can contain one-time links).
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[email] RESEND_API_KEY / EMAIL_FROM not configured — "${subject}" was not sent.`);
    if (process.env.NODE_ENV !== "production") console.info(`[email:dev] to=${to}\n${text}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) console.error(`[email] Resend responded ${res.status} for "${subject}"`);
    return res.ok;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}

export function passwordResetEmail(link: string, name: string, locale: string) {
  const ar = locale === "ar";
  const subject = ar ? "إعادة تعيين كلمة المرور — DODANA" : "Reset your DODANA password";
  const greeting = ar ? `أهلًا ${name}،` : `Hi ${name},`;
  const body = ar
    ? "وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك. الرابط صالح لمدة ساعة واحدة."
    : "We received a request to reset the password on your account. This link is valid for one hour.";
  const cta = ar ? "إعادة تعيين كلمة المرور" : "Reset password";
  const ignore = ar
    ? "لو مطلبتيش ده، تجاهلي الرسالة — كلمة المرور الحالية هتفضل زي ما هي."
    : "If you didn't ask for this, you can ignore this email — your current password stays the same.";

  const text = `${greeting}\n\n${body}\n\n${link}\n\n${ignore}\n\nDODANA`;
  const html = `<!doctype html><html dir="${ar ? "rtl" : "ltr"}"><body style="margin:0;background:#FBF5EF;font-family:Georgia,serif;color:#3A2620">
<div style="max-width:520px;margin:0 auto;padding:40px 28px">
<p style="font-size:26px;letter-spacing:2px;margin:0 0 28px">DODANA</p>
<p style="font-size:16px;margin:0 0 12px">${greeting}</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 28px;font-family:Arial,sans-serif;color:#4F352B">${body}</p>
<a href="${link}" style="display:inline-block;background:#3A2620;color:#FBF5EF;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold">${cta}</a>
<p style="font-size:13px;line-height:1.6;margin:28px 0 0;font-family:Arial,sans-serif;color:#6B4A3D">${ignore}</p>
</div></body></html>`;

  return { subject, text, html };
}
