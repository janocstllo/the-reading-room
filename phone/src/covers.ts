import coverIds from "./data/covers.json";

// Open Library cover ids per catalog title (by slug). Same list as client/src/data/covers.json.
const COVERS = coverIds as Record<string, number>;

export function coverUrl(slug: string, size: "S" | "M" | "L" = "M"): string | null {
  const id = COVERS[slug];
  return id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg?default=false` : null;
}

// A steady colour per category, used for books without a cover picture.
export function categoryHue(category: string): number {
  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function categoryColor(category: string, lightness = 30): string {
  return `hsl(${categoryHue(category)}, 34%, ${lightness}%)`;
}
