import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWaitlistConfirmation(email: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: "Vous êtes sur la waitlist Loopflo !",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:32px;">
            <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin:0 0 16px;">Vous êtes sur la liste !</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.7;margin:0 0 24px;">Merci pour votre intérêt pour Loopflo. Vous serez parmi les premiers à accéder à la plateforme.</p>
            <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="font-size:13px;color:#4F46E5;font-weight:600;margin:0 0 8px;">Ce qui vous attend :</p>
              <ul style="font-size:13px;color:#4338CA;margin:0;padding-left:16px;line-height:2;">
                <li>Automatisez vos workflows sans coder</li>
                <li>IA intégrée pour générer des flows en secondes</li>
                <li>Plan gratuit à vie disponible au lancement</li>
              </ul>
            </div>
            <p style="font-size:13px;color:#9CA3AF;margin:0;">On vous contactera très bientôt. Partagez Loopflo autour de vous !</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo · Vous recevez cet email car vous vous êtes inscrit sur notre waitlist.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email waitlist error:", error);
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: "Bienvenue sur Loopflo !",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:32px;">
            <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin:0 0 16px;">Bienvenue ${name} !</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.7;margin:0 0 24px;">Votre compte Loopflo est créé. Automatisez vos workflows dès maintenant.</p>
            <a href="https://flowforge-ashen.vercel.app/dashboard" style="display:block;text-align:center;background:#4F46E5;color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:10px;text-decoration:none;margin-bottom:16px;">Accéder à mon dashboard →</a>
            <div style="border-top:1px solid #F3F4F6;padding-top:20px;">
              <p style="font-size:13px;color:#9CA3AF;margin:0 0 8px;font-weight:600;">Pour commencer :</p>
              <ul style="font-size:13px;color:#6B7280;margin:0;padding-left:16px;line-height:2;">
                <li>Créez votre premier workflow</li>
                <li>Connectez vos applications</li>
                <li>Activez l'automatisation</li>
              </ul>
            </div>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email welcome error:", error);
  }
}