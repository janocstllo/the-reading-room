// Sends email through an HTTP email API (plain fetch), which works on Wasmer's
// QuickJS engine where SMTP sockets are not dependable.
//
//   MAIL_PROVIDER = "brevo" | "resend"   (leave empty in development: the email
//                                        is printed to the server console)
//   MAIL_API_KEY  = the provider's API key
//   MAIL_FROM     = sender address (Brevo: a verified sender; Resend: an address
//                   on your verified domain)
//   MAIL_FROM_NAME = name shown in the inbox (default "The Reading Room")

export type Mail = { to: string; subject: string; text: string; html: string };

export function mailConfigured(): boolean {
  return Boolean(process.env.MAIL_PROVIDER && process.env.MAIL_API_KEY && process.env.MAIL_FROM);
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email provider answered ${response.status}: ${detail.slice(0, 300)}`);
  }
}

export async function sendMail(mail: Mail): Promise<void> {
  const provider = (process.env.MAIL_PROVIDER || "").toLowerCase();
  const apiKey = process.env.MAIL_API_KEY || "";
  const from = process.env.MAIL_FROM || "";
  const fromName = process.env.MAIL_FROM_NAME || "The Reading Room";

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (MAIL_PROVIDER, MAIL_API_KEY, MAIL_FROM).");
    }
    console.log(`\n[mail] To: ${mail.to}\n[mail] ${mail.subject}\n${mail.text}\n`);
    return;
  }

  if (provider === "brevo") {
    await post(
      "https://api.brevo.com/v3/smtp/email",
      { "api-key": apiKey },
      {
        sender: { email: from, name: fromName },
        to: [{ email: mail.to }],
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: mail.html,
      },
    );
    return;
  }

  if (provider === "resend") {
    await post(
      "https://api.resend.com/emails",
      { Authorization: `Bearer ${apiKey}` },
      { from: `${fromName} <${from}>`, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html },
    );
    return;
  }

  throw new Error(`Unknown MAIL_PROVIDER "${provider}". Use "brevo" or "resend".`);
}

export function signupCodeMail(to: string, name: string, code: string): Mail {
  const subject = `${code} is your Reading Room code`;
  const text = [
    `Hello ${name},`,
    "",
    `Your code to finish creating your Reading Room account is: ${code}`,
    "",
    "It expires in 15 minutes. If you did not ask for this, ignore this email.",
  ].join("\n");
  const safeName = name.replace(/[<>&"]/g, "");
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:auto;padding:24px;color:#2a2118">
  <h2 style="margin:0 0 12px">The Reading Room</h2>
  <p>Hello ${safeName},</p>
  <p>Your code to finish creating your account is:</p>
  <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${code}</p>
  <p style="color:#6b5d4f">It expires in 15 minutes. If you did not ask for this, ignore this email.</p>
</div>`;
  return { to, subject, text, html };
}
