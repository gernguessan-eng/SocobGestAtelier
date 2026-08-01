"use client";

import { FormEvent, useState } from "react";
import { signIn, signUp } from "@/lib/auth-service";

type Mode = "login" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Merci de renseigner votre identifiant et votre mot de passe.");
      return;
    }
    if (mode === "signup" && !role.trim()) {
      setError("Merci de préciser votre fonction.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(username, password, role, email || undefined);
      } else {
        await signIn(username, password);
      }
      // onAuthStateChanged (subscribed higher up) takes it from here.
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) {
        setError("Identifiant ou mot de passe incorrect.");
      } else if (code.includes("auth/email-already-in-use")) {
        setError("Cet identifiant est déjà utilisé. Essayez de vous connecter à la place.");
      } else if (code.includes("auth/weak-password")) {
        setError("Le mot de passe est trop faible (6 caractères minimum).");
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
          <div className="auth-logo">SG</div>
          <h1>socob_GestAtelier</h1>
          <p>Accès sécurisé à l&rsquo;application de gestion de garage automobile. Connectez-vous ou créez un compte lors de la première utilisation.</p>
          <div className="auth-hint">
            Première utilisation : créez votre compte avec un identifiant, un mot de passe et votre fonction. Aucun compte n&rsquo;est pré-enregistré.
          </div>
          <div className="auth-footnote"><span className="auth-dot" />Atelier connecté · Données sécurisées sur Firebase</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(null); }}>Connexion</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(null); }}>Création de compte</button>
          </div>

          <label className="auth-field">
            <span>Identifiant</span>
            <input type="text" autoComplete="username" placeholder="Votre nom d'utilisateur" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          <label className="auth-field">
            <span>Mot de passe</span>
            <div className="auth-password-wrap">
              <input type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="••••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher le mot de passe">{showPassword ? "🙈" : "👁"}</button>
            </div>
          </label>

          {mode === "signup" && (
            <label className="auth-field">
              <span>Fonction</span>
              <input type="text" placeholder="Ex : Chef d'atelier, Gérant, Réceptionniste…" value={role} onChange={(event) => setRole(event.target.value)} />
            </label>
          )}

          {mode === "signup" && (
            <label className="auth-field">
              <span>Email <em>(optionnel)</em></span>
              <input type="email" placeholder="vous@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Veuillez patienter…" : mode === "signup" ? "Créer le compte et entrer" : "Se connecter"}
          </button>

          <p className="auth-terms">En accédant à l&rsquo;application, vous acceptez les conditions d&rsquo;utilisation interne du garage.</p>
        </form>
      </div>
    </div>
  );
}
