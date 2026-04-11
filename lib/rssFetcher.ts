export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
};

function extractTag(xml: string, tag: string): string {
  // Essaie d'abord CDATA
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, "i");
  const cdata = xml.match(cdataRe);
  if (cdata) return cdata[1].trim();

  // Puis texte simple
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").trim();
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function parseItems(xml: string): RSSItem[] {
  // Supporte RSS <item> et Atom <entry>
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const entryRe = /<entry[\s>]([\s\S]*?)<\/entry>/gi;

  const chunks: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) chunks.push(m[1]);
  if (chunks.length === 0) {
    while ((m = entryRe.exec(xml)) !== null) chunks.push(m[1]);
  }

  return chunks.map(chunk => {
    const title = extractTag(chunk, "title") || "(sans titre)";

    // Atom: <link href="..."/> ou RSS: <link>...</link>
    let link = extractTag(chunk, "link");
    if (!link) link = extractAttr(chunk, "link", "href");

    const description = extractTag(chunk, "description")
      || extractTag(chunk, "summary")
      || extractTag(chunk, "content");

    const pubDate = extractTag(chunk, "pubDate")
      || extractTag(chunk, "published")
      || extractTag(chunk, "updated")
      || new Date().toISOString();

    // guid = identifiant unique de l'item
    const guid = extractTag(chunk, "guid")
      || extractTag(chunk, "id")
      || link
      || title;

    return { title, link, description, pubDate, guid };
  });
}

/**
 * Récupère et parse un flux RSS/Atom.
 * Retourne jusqu'à 20 items, du plus récent au plus ancien.
 */
export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Loopflo RSS Reader/1.0",
      "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);

  const xml = await res.text();
  const items = parseItems(xml);
  return items.slice(0, 20);
}
