import { Link, NavLink } from "react-router-dom";
import { useRoom } from "../session";

export function Masthead() {
  const { reader, librarianOpen, setLibrarianOpen, signOut } = useRoom();

  return (
    <header className="masthead">
      <div className="masthead__inner">
        <Link className="brand-link" to="/">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 7.5c4-1.6 8-1.4 12 1v17c-4-2.4-8-2.6-12-1z" />
            <path d="M28 7.5c-4-1.6-8-1.4-12 1v17c4-2.4 8-2.6 12-1z" />
          </svg>
          <span>
            <span className="brand">The Reading Room</span>
            <span className="kicker">A public-domain catalog</span>
          </span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Catalog
          </NavLink>
          <NavLink to="/shelf">Shelf</NavLink>
          <NavLink to="/marks">Bookmarks</NavLink>
          {reader?.role === "desk" ? <NavLink to="/desk">Desk</NavLink> : null}
          <button
            className={librarianOpen ? "nav-button is-on" : "nav-button"}
            type="button"
            aria-pressed={librarianOpen}
            onClick={() => setLibrarianOpen(!librarianOpen)}
          >
            Librarian
          </button>
          <span className="nav-divider" aria-hidden="true" />
          {reader ? (
            <>
              <span className="who" title={reader.email}>
                <span className="who__initial" aria-hidden="true">
                  {reader.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
                {reader.name}
              </span>
              <button className="nav-button" type="button" onClick={() => void signOut()}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/enter">Sign in</NavLink>
              <Link className="btn btn-primary btn-small" to="/join">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
