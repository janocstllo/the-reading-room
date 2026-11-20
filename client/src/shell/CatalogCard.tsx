import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { displayYear, type TitleRecord } from "../api";
import { BookCover } from "./BookCover";

export function CatalogCard({
  title,
  action,
}: {
  title: TitleRecord;
  action?: ReactNode;
}) {
  return (
    <article className="book-card">
      <Link className="book-card__hero" to={`/titles/${title.id}`}>
        <BookCover title={title} className="book-card__cover" decorative />
        <span className="book-card__shade" />
        <span className="book-card__heading">
          <span className="book-card__tag">{title.category}</span>
          <h3 className="book-card__title">{title.work}</h3>
          <span className="book-card__writer">{title.writer}</span>
        </span>
      </Link>
      <div className="book-card__body">
        <p className="eyebrow">{displayYear(title.year)}</p>
        <p className="book-card__note">{title.note}</p>
        {action ? <div className="actions book-card__actions">{action}</div> : null}
      </div>
    </article>
  );
}
