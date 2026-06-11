/**
 * Shared site-level constants. Consumed by metadata exports, sitemap, robots,
 * and legacy URL redirects so they all agree on the canonical origin.
 */

const FALLBACK_URL = "https://monthly-renaissance.com";

function resolveSiteUrl(): string {
  const raw = process.env.AUTH_URL?.trim();
  if (!raw) return FALLBACK_URL;
  return raw.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Monthly Renaissance";

export const ISSN = "1605-0045";

export const SITE_DESCRIPTION =
  "A journal of Islamic research and information, publishing scholarly articles on the Quran, Hadith, Islamic law, ethics, and contemporary issues since 1991.";
