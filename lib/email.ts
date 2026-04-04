import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Loopflo <contact@loopflo.app>";

export async function sendWaitlistConfirmation(email: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Vous êtes sur la waitlist Loopflo !",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:32px;">
            <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin:0 0 16px;">Vous êtes sur la liste !</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
              Merci pour votre intérêt pour Loopflo. Vous serez parmi les premiers à accéder à la plateforme.
            </p>
            <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;padding:16px 20px;">
              <p style="font-size:13px;color:#4F46E5;font-weight:600;margin:0 0 8px;">Ce qui vous attend :</p>
              <ul style="font-size:13px;color:#4338CA;margin:0;padding-left:16px;line-height:2;">
                <li>Automatisez vos workflows sans coder</li>
                <li>IA intégrée pour générer des flows en secondes</li>
                <li>Plan gratuit à vie disponible au lancement</li>
              </ul>
            </div>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo</p>
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
      from: FROM,
      to: email,
      subject: "Bienvenue sur Loopflo !",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:32px;">
            <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin:0 0 16px;">Bienvenue ${name} !</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
              Votre compte Loopflo est créé. Automatisez vos workflows dès maintenant.
            </p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:block;text-align:center;background:#4F46E5;color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:10px;text-decoration:none;">
              Accéder à mon dashboard →
            </a>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email welcome error:", error);
  }
}

export async function sendWorkflowEmail(to: string, subject: string, body: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <div style="margin-bottom:24px;">
          <span style="font-size:18px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px;">
          <h2 style="font-size:18px;font-weight:700;color:#0A0A0A;margin:0 0 12px;">${subject}</h2>
          <p style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</p>
        </div>
        <p style="font-size:11px;color:#D1D5DB;margin-top:16px;text-align:center;">Envoyé automatiquement par Loopflo</p>
      </div>
    `,
  });
}

export async function sendWorkflowErrorAlert(
  userEmail: string,
  workflowName: string,
  errors: { node: string; error: string }[]
) {
  try {
    const errorList = errors.map(e =>
      `<li style="margin-bottom:8px;"><strong>${e.node}</strong> : ${e.error}</li>`
    ).join("");

    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `Erreur dans votre workflow "${workflowName}"`,
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #FECACA;border-radius:16px;padding:32px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#FEF2F2;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:20px;">⚠️</span>
            </div>
            <h1 style="font-size:20px;font-weight:800;color:#0A0A0A;margin:0 0 8px;">Votre workflow a rencontré une erreur</h1>
            <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">
              Le workflow <strong style="color:#0A0A0A;">${workflowName}</strong> s'est exécuté mais certains nœuds ont échoué.
            </p>
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
              <p style="font-size:13px;font-weight:700;color:#991B1B;margin:0 0 10px;">Nœuds en erreur :</p>
              <ul style="font-size:13px;color:#DC2626;margin:0;padding-left:16px;line-height:1.8;">
                ${errorList}
              </ul>
            </div>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:block;text-align:center;background:#4F46E5;color:#fff;font-size:14px;font-weight:700;padding:12px;border-radius:10px;text-decoration:none;">
              Ouvrir le dashboard →
            </a>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo — <a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="color:#D1D5DB;">Gérer les notifications</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email error alert error:", error);
  }
}

export async function sendLaunchAnnouncement(email: string, isUser: boolean) {
  try {
    const ctaUrl = isUser
      ? `${process.env.NEXTAUTH_URL}/dashboard`
      : `${process.env.NEXTAUTH_URL}/register`;
    const ctaLabel = isUser ? "Accéder à Loopflo →" : "Créer mon compte gratuit →";
    const intro = isUser
      ? "Votre compte est déjà créé — connectez-vous et découvrez toutes les nouvelles fonctionnalités."
      : "Vous étiez sur notre waitlist. Loopflo est maintenant disponible — créez votre compte gratuitement.";

    await resend.emails.send({
      from: "Colin de Loopflo <contact@loopflo.app>",
      to: email,
      subject: "Loopflo est officiellement lancé !",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:28px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:32px;">
            <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin:0 0 16px;">Loopflo est en ligne !</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.7;margin:0 0 20px;">${intro}</p>
            <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="font-size:13px;color:#4F46E5;font-weight:700;margin:0 0 10px;">Ce que vous pouvez faire avec Loopflo :</p>
              <ul style="font-size:13px;color:#4338CA;margin:0;padding-left:16px;line-height:2.1;">
                <li>Automatiser vos workflows sans écrire une ligne de code</li>
                <li>Utiliser l'IA pour configurer vos automatisations en quelques secondes</li>
                <li>Connecter Gmail, Notion, Slack, Google Sheets, et plus</li>
                <li>Plan gratuit disponible — pas besoin de carte bancaire</li>
              </ul>
            </div>
            <a href="${ctaUrl}" style="display:block;text-align:center;background:#4F46E5;color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:10px;text-decoration:none;margin-bottom:16px;">
              ${ctaLabel}
            </a>
            <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0;">Des questions ? Répondez directement à cet email.</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo · <a href="${process.env.NEXTAUTH_URL}" style="color:#D1D5DB;">loopflo.app</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Launch email error:", error);
  }
}

export async function sendForgotPasswordEmail(email: string, resetUrl: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Réinitialisation de votre mot de passe Loopflo",
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#FAFAFA;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:800;color:#0A0A0A;">Loop<span style="color:#4F46E5;">flo</span></span>
          </div>
          <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:32px;">
            <h1 style="font-size:22px;font-weight:800;color:#0A0A0A;margin:0 0 16px;">Réinitialisation du mot de passe</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
              Vous avez demandé à réinitialiser votre mot de passe. Ce lien expire dans 1 heure.
            </p>
            <a href="${resetUrl}" style="display:block;text-align:center;background:#4F46E5;color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
              Réinitialiser mon mot de passe →
            </a>
            <p style="font-size:13px;color:#9CA3AF;margin:0;">Si vous n'avez pas demandé cela, ignorez cet email.</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#D1D5DB;margin-top:24px;">© 2025 Loopflo</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email reset error:", error);
  }
}
