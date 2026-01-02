// Für Freitext (fuzzy, aggressiv)
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Für Tags (kontrolliert, nicht zerstören)
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim();
}
