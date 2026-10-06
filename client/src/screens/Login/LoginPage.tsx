import { useState, type FormEvent } from "react";
import { ArrowRightLeft, Box, Eye, EyeOff, Laptop, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { useAuth, type AuthenticatedUser } from "@/auth/AuthContext";
import miitLogo from "@/assets/MIIT_LOGO.jpg";
import campusPhoto from "@/assets/miit-campus-reference.png";
import "./auth.css";

type LoginResponse = {
  requiresOtp?: boolean;
  challengeId?: string;
  expiresIn?: number;
  resendAfter?: number;
  accessToken?: string;
  user?: AuthenticatedUser;
  message?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<LoginResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setChallenge(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const payload = (await response.json()) as LoginResponse;
      if (!response.ok) throw new Error(payload.message ?? "Unable to start secure sign in.");
      if (payload.accessToken && payload.user) {
        signIn(payload.accessToken, payload.user);
        navigate(payload.user.role.code === "LAPTOP_RENTAL" ? "/laptop-rental" : "/", { replace: true });
        return;
      }
      if (!payload.requiresOtp || !payload.challengeId) {
        throw new Error(payload.message ?? "Unable to start secure sign in.");
      }
      setChallenge(payload);
      setPassword("");
      navigate("/verify-otp", {
        state: {
          challengeId: payload.challengeId,
          email: normalizedEmail,
          expiresIn: payload.expiresIn ?? 300,
          resendAfter: payload.resendAfter ?? 60,
        },
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="miit-login">
      <header className="miit-login-header">
        <div className="miit-login-brand">
          <img src={miitLogo} alt="MIIT crest" />
          <div><strong>MIIT</strong><span>Store Management System</span></div>
        </div>
      </header>

      <div className="miit-login-grid">
        <section className="miit-login-story" aria-labelledby="miit-workspace-title">
          <h1 id="miit-workspace-title">MIIT assets,<br />all in one place.</h1>
          <p>Manage inventory, transfers, QR records, and<br className="hidden xl:block" /> laptop rentals.</p>
          <div className="miit-campus-frame">
            <img src={campusPhoto} alt="Myanmar Institute of Information Technology campus" fetchPriority="high" />
          </div>
          <ul className="miit-feature-list" aria-label="Workspace features">
            <li><Box aria-hidden="true" /><span>Assets</span></li>
            <li><ArrowRightLeft aria-hidden="true" /><span>Transfers</span></li>
            <li><Laptop aria-hidden="true" /><span>Rentals</span></li>
          </ul>
        </section>

        <section className="miit-signin-card" aria-labelledby="miit-signin-title">
          <div className="miit-signin-heading">
            <div className="miit-lock-badge"><LockKeyhole aria-hidden="true" /></div>
            <h2 id="miit-signin-title">Sign in</h2>
            <p>MIIT Store Management System</p>
          </div>
          {error && <div id="miit-login-error" role="alert" className="miit-login-error">{error}</div>}
          {challenge ? (
            <div role="status" className="miit-login-status">
              <strong>Verification code sent</strong>
              <p>A six-digit code was sent to your registered email. It expires in {Math.ceil((challenge.expiresIn ?? 300) / 60)} minutes. Continue with verification to complete sign in.</p>
            </div>
          ) : (
            <form className="miit-signin-form" onSubmit={handleSubmit} noValidate aria-busy={loading} aria-describedby={error ? "miit-login-error" : undefined}>
              <div className="miit-field">
                <Label htmlFor="email">Email</Label>
                <div className="miit-input-wrap">
                  <Mail className="miit-field-icon" aria-hidden="true" />
                  <Input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" disabled={loading} required />
                </div>
              </div>
              <div className="miit-field">
                <Label htmlFor="password">Password</Label>
                <div className="miit-input-wrap">
                  <LockKeyhole className="miit-field-icon" aria-hidden="true" />
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" disabled={loading} required />
                  <button type="button" className="miit-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)} disabled={loading}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="miit-signin-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
            </form>
          )}
          <p className="miit-login-help">Need access? Contact admin.</p>
        </section>
      </div>
    </main>
  );
}
