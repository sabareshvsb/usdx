"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Please enter both your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      router.replace("/");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <main className="register-shell">
      <nav className="guide-nav glass-panel">
        <Link href="/" className="guide-brand"><span>U</span> USDX <small>YOUTH WING</small></Link>
        <Link href="/" className="guide-back">← Back to landing</Link>
      </nav>
      <section className="register-card glass-panel">
        <p className="eyebrow register-eyebrow"><span /> USDX / REGISTRATION</p>
        <h1 className="register-title">Register to the<br /><em>Compounding Scheme.</em></h1>
        <p className="register-note">Enter your details below and we will send a welcome email confirming your registration with the Youth Wing.</p>
        <form className="register-form" onSubmit={handleSubmit}>
          <label className="register-field">
            <span>Your name</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. John Carter" autoComplete="name" required />
          </label>
          <label className="register-field">
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </label>
          {error ? <p className="register-error" role="alert">{error}</p> : null}
          <button type="submit" className="primary-cta register-submit" disabled={submitting}>
            {submitting ? "Registering…" : (<><span className="register-submit-label">Register Now</span><span aria-hidden="true">→</span></>)}
          </button>
        </form>
      </section>
    </main>
  );
}
