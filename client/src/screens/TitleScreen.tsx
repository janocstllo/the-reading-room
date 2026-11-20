import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addBookmark,
  addToShelf,
  displayYear,
  downloadCard,
  getTitle,
  removeBookmark,
  removeFromShelf,
  type TitleRecord,
} from "../api";
import { categoryHue, coverUrl } from "../covers";
import { BookCover } from "../shell/BookCover";
import { useRoom } from "../session";

export function TitleScreen() {
  const { id = "" } = useParams();
  const { reader, shelfVersion, bumpShelf } = useRoom();
  const [title, setTitle] = useState<TitleRecord | null>(null);
  const [problem, setProblem] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProblem("");
    getTitle(id)
      .then((next) => {
        if (!cancelled) setTitle(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setProblem(error instanceof Error ? error.message : "That record could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, shelfVersion, reader?.id]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      bumpShelf();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request did not finish.");
    } finally {
      setBusy(false);
    }
  }

  if (problem) return <p className="banner">{problem}</p>;
  if (!title) return <p className="notice">Opening the record…</p>;

  const backdrop = coverUrl(title.slug, "M");
  const heroStyle = {
    "--hue": categoryHue(title.category),
    ...(backdrop ? { "--backdrop": `url("${backdrop}")` } : {}),
  } as CSSProperties;

  return (
    <article className="title-screen">
      <Link className="back-link" to="/">
        ← Back to the catalog
      </Link>
      <header className={backdrop ? "title-hero" : "title-hero title-hero--plain"} style={heroStyle}>
        <BookCover title={title} size="L" className="title-hero__cover" />
        <div className="title-hero__text">
          <p className="title-hero__tag">
            {title.category} · {displayYear(title.year)}
          </p>
          <h2 className="title-hero__title">{title.work}</h2>
          <p className="title-hero__writer">by {title.writer}</p>
          <div className="actions">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void run(() => downloadCard(title))}>
              Download bibliographic card
            </button>
            {reader ? (
              <>
                <button
                  className="btn btn-light"
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => (title.onShelf ? removeFromShelf(title.id) : addToShelf(title.id)))}
                >
                  {title.onShelf ? "Remove from shelf" : "Save to shelf"}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => (title.bookmarked ? removeBookmark(title.id) : addBookmark(title.id)))}
                >
                  {title.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                </button>
              </>
            ) : (
              <Link className="btn btn-ghost" to="/enter">
                Sign in to keep a shelf
              </Link>
            )}
          </div>
        </div>
      </header>
      {message ? <p className="banner">{message}</p> : null}
      <div className="title-body">
        <section className="title-body__note">
          <h3>About this work</h3>
          <p>{title.note}</p>
        </section>
        <aside className="title-body__facts">
          <dl>
            <dt>Writer</dt>
            <dd>{title.writer}</dd>
            <dt>Year</dt>
            <dd>{displayYear(title.year)}</dd>
            <dt>Section</dt>
            <dd>{title.category}</dd>
            <dt>Shelf mark</dt>
            <dd>{title.slug}</dd>
          </dl>
          {title.gutenbergUrl ? (
            <a className="btn btn-secondary" href={title.gutenbergUrl} target="_blank" rel="noreferrer">
              Read free on Project Gutenberg ↗
            </a>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
