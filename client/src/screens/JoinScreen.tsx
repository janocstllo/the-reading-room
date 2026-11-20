import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, resendSignupCode, verifySignup } from "../api";
import { useRoom } from "../session";

export function JoinScreen() {
  const navigate = useNavigate();
  const { signIn } = useRoom();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function attempt(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void attempt(async () => {
      const result = await register({ name, email, password });
      setPendingEmail(result.email);
      setCode("");
    }, "Registration failed.");
  }

  function confirm(event: FormEvent) {
    event.preventDefault();
    void attempt(async () => {
      const result = await verifySignup(pendingEmail, code);
      signIn(result.token, result.reader);
      navigate("/");
    }, "That code could not be checked.");
  }

  if (pendingEmail) {
    return (
      <section>
        <h2>Check your email</h2>
        <form className="form" onSubmit={confirm}>
          <p>
            We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below to finish creating your account.
            Look in your spam folder if it does not arrive.
          </p>
          <label>
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
              minLength={6}
              maxLength={6}
              autoFocus
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          {notice ? <p>{notice}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={busy || code.length !== 6}>
            Verify and create account
          </button>
          <button
            className="btn btn-text"
            type="button"
            disabled={busy}
            onClick={() =>
              void attempt(async () => {
                await resendSignupCode(pendingEmail);
                setNotice("A new code is on its way.");
              }, "The code could not be sent.")
            }
          >
            Send a new code
          </button>
          <button className="btn btn-text" type="button" disabled={busy} onClick={() => setPendingEmail("")}>
            Use a different email
          </button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <h2>Register</h2>
      <form className="form" onSubmit={submit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Sending code…" : "Create account"}
        </button>
        <Link className="btn btn-text" to="/enter">
          Already registered? Sign in
        </Link>
      </form>
    </section>
  );
}
