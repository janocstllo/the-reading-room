import { useState, type CSSProperties } from "react";
import type { TitleRecord } from "../api";
import { categoryHue, coverUrl } from "../covers";

type Props = {
  title: Pick<TitleRecord, "slug" | "work" | "writer" | "category">;
  size?: "M" | "L";
  className?: string;
  /** Hide the image from screen readers when the title is already shown as text nearby. */
  decorative?: boolean;
};

/** The book's cover picture, or a cloth-bound style cover when there is no picture. */
export function BookCover({ title, size = "M", className = "", decorative = false }: Props) {
  const url = coverUrl(title.slug, size);
  const [failed, setFailed] = useState(false);
  const style = { "--hue": categoryHue(title.category) } as CSSProperties;

  if (url && !failed) {
    return (
      <img
        className={`cover ${className}`}
        src={url}
        alt={decorative ? "" : `Cover of ${title.work}`}
        loading="lazy"
        decoding="async"
        style={style}
        onError={() => setFailed(true)}
        onLoad={(event) => {
          // Open Library returns a 1×1 image when it has no cover.
          if (event.currentTarget.naturalWidth < 10) setFailed(true);
        }}
      />
    );
  }

  return (
    <div className={`cover cover-plain ${className}`} style={style} aria-hidden={decorative || undefined}>
      <span className="cover-plain__rule" />
      <span className="cover-plain__work">{title.work}</span>
      <span className="cover-plain__writer">{title.writer}</span>
    </div>
  );
}
