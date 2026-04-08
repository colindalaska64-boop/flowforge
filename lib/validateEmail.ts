// Liste des domaines d'emails jetables/temporaires les plus courants
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","tempmail.com","throwam.com","yopmail.com",
  "trashmail.com","sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.net","guerrillamail.org",
  "spam4.me","maildrop.cc","dispostable.com","mailnull.com","spamgourmet.com",
  "trashmail.at","trashmail.io","trashmail.me","trashmail.net","fakeinbox.com",
  "getnada.com","mailnesia.com","discard.email","spamherelots.com","spamhereplease.com",
  "mintemail.com","tempr.email","trbvm.com","mailscrap.com","zetmail.com",
  "binkmail.com","bob.email","bob-email.com","lol.ovpn.to","rppkn.com",
  "example.com","test.com","test.fr","noemail.com","noreply.com","invalid.com",
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== "string") return { valid: false, reason: "Email manquant." };
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 255) return { valid: false, reason: "Email trop long." };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, reason: "Format d'email invalide." };

  const domain = trimmed.split("@")[1];
  if (!domain) return { valid: false, reason: "Format d'email invalide." };
  if (DISPOSABLE_DOMAINS.has(domain)) return { valid: false, reason: "Les adresses email temporaires ne sont pas acceptées." };

  // Bloquer les TLD suspects (juste des chiffres, trop courts)
  const tld = domain.split(".").pop() || "";
  if (tld.length < 2) return { valid: false, reason: "Format d'email invalide." };

  return { valid: true };
}
