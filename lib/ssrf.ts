import { lookup } from "dns";
import { promisify } from "util";

const dnsLookup = promisify(lookup);

// Plages IPv4 privées / réservées — toute requête vers ces IPs est bloquée
type Range = { start: number; end: number };

function ip2long(ip: string): number {
  return ip.split(".").reduce((acc, p) => ((acc << 8) | parseInt(p, 10)) >>> 0, 0) >>> 0;
}

const BLOCKED: Range[] = [
  { start: ip2long("0.0.0.0"),       end: ip2long("0.255.255.255")   }, // "This" network
  { start: ip2long("10.0.0.0"),      end: ip2long("10.255.255.255")  }, // RFC1918 private
  { start: ip2long("100.64.0.0"),    end: ip2long("100.127.255.255") }, // Shared address space
  { start: ip2long("127.0.0.0"),     end: ip2long("127.255.255.255") }, // Loopback
  { start: ip2long("169.254.0.0"),   end: ip2long("169.254.255.255") }, // Link-local / AWS metadata
  { start: ip2long("172.16.0.0"),    end: ip2long("172.31.255.255")  }, // RFC1918 private
  { start: ip2long("192.0.0.0"),     end: ip2long("192.0.0.255")     }, // IETF Protocol Assignments
  { start: ip2long("192.168.0.0"),   end: ip2long("192.168.255.255") }, // RFC1918 private
  { start: ip2long("198.18.0.0"),    end: ip2long("198.19.255.255")  }, // Benchmarking
  { start: ip2long("224.0.0.0"),     end: ip2long("255.255.255.255") }, // Multicast + broadcast
];

function isPrivateIPv4(ip: string): boolean {
  const long = ip2long(ip);
  return BLOCKED.some(r => long >= r.start && long <= r.end);
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const LOCALHOST_NAMES = new Set(["localhost", "ip6-localhost", "ip6-loopback"]);

/**
 * Vérifie qu'une URL ne pointe pas vers une ressource interne (SSRF).
 * Lance une Error si l'URL est bloquée.
 * À appeler avant tout fetch() vers une URL fournie par l'utilisateur.
 */
export async function assertNoSSRF(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL invalide.");
  }

  const { hostname, protocol } = parsed;

  // Seuls http(s) autorisés
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`Protocole non autorisé: "${protocol}" — seuls http et https sont acceptés.`);
  }

  // Noms locaux évidents
  if (LOCALHOST_NAMES.has(hostname.toLowerCase())) {
    throw new Error("SSRF bloqué: hostname local.");
  }

  // Adresse IPv6 loopback/private
  if (hostname === "::1" || hostname.startsWith("[::1]") || hostname.startsWith("[fc") || hostname.startsWith("[fd")) {
    throw new Error("SSRF bloqué: adresse IPv6 privée.");
  }

  // IPv4 directe — pas de résolution DNS nécessaire
  if (IPV4_RE.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw new Error(`SSRF bloqué: IP privée/réservée (${hostname}).`);
    }
    return;
  }

  // Résolution DNS — vérifie que l'IP résolue n'est pas privée
  try {
    const { address } = await dnsLookup(hostname, { family: 4 });
    if (isPrivateIPv4(address)) {
      throw new Error(`SSRF bloqué: "${hostname}" résout vers une IP privée (${address}).`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("SSRF")) throw e;
    // Résolution impossible → bloquer par précaution
    throw new Error(`SSRF bloqué: impossible de résoudre "${hostname}".`);
  }
}
