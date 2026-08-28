"use client";

import { FormEvent, useState } from "react";
import { signIn } from "@/lib/auth-service";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Merci de renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      await signIn(username, password);
      // onAuthStateChanged (subscribed higher up) takes it from here.
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) {
        setError("Identifiant ou mot de passe incorrect.");
      } else if (code.includes("auth/too-many-requests")) {
        setError("Trop de tentatives. Merci de réessayer dans quelques minutes.");
      } else {
        setError("Une erreur est survenue. Merci de réessayer.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/socob-logo.png" alt="Logo SOCOB" className="auth-logo" />
          <h1>socob_GestAtelier</h1>
          <p>Accès sécurisé à l&rsquo;application de gestion de garage automobile.</p>
          <div className="auth-hint">
            Les comptes sont créés par un administrateur de l&rsquo;atelier. Si vous n&rsquo;avez pas encore d&rsquo;identifiant, rapprochez-vous de votre responsable.
          </div>
          <div className="auth-footnote"><span className="auth-dot" />Atelier connecté · Données sécurisées sur Firebase</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Identifiant</span>
            <input type="text" autoComplete="username" placeholder="Votre nom d'utilisateur" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          <label className="auth-field">
            <span>Mot de passe</span>
            <div className="auth-password-wrap">
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher le mot de passe">{showPassword ? "🙈" : "👁"}</button>
            </div>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Veuillez patienter…" : "Se connecter"}
          </button>

          <p className="auth-terms">En accédant à l&rsquo;application, vous acceptez les conditions d&rsquo;utilisation interne du garage.</p>
        </form>
      </div>
    </div>
  );
}
