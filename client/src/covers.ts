import coverIds from "./data/covers.json";

// Open Library cover ids, looked up once per catalog title (by slug).
// Regenerate data/covers.json when many new titles are added.
const COVERS = coverIds as Record<string, number>;

export function coverUrl(slug: string, size: "S" | "M" | "L" = "M"): string | null {
  const id = COVERS[slug];
  // default=false makes a missing cover fail (404) instead of returning a blank pixel.
  return id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg?default=false` : null;
}

// A steady colour per category, used for books without a cover picture.
export function categoryHue(category: string): number {
  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}
