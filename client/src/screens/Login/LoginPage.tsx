import { useState, type FormEvent, type ReactNode } from "react";
import {
  Boxes,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
type LoginResponse = {
  requiresOtp?: boolean;
  challengeId?: string;
  expiresIn?: number;
  resendAfter?: number;
  message?: string;
};
export default function LoginPage() {
  const navigate = useNavigate();
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
      if (!response.ok || !payload.requiresOtp || !payload.challengeId)
        throw new Error(payload.message ?? "Unable to start secure sign in.");
      // This is intentionally only a pending challenge; no user session is created here.
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-page min-h-screen bg-[#F4F7FB] p-4 sm:p-6 lg:p-8">
      <div className="auth-card mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-2xl border border-[#DCE3ED] bg-white shadow-sm md:grid-cols-[1.08fr_0.92fr] sm:min-h-[calc(100vh-3rem)]">
        <section
          className="hidden bg-[#162A46] p-10 text-white md:flex md:flex-col lg:p-14"
          aria-label="System overview"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-white text-[#162A46]">
              <Boxes className="size-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold tracking-wide">
              MIIT STORE
            </span>
          </div>
          <div className="my-auto max-w-lg">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
              Institutional asset management
            </p>
            <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
              MIIT Store Management System
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-200">
              Manage institutional assets, inventory locations, transfers, QR
              records, and laptop rentals from one secure workspace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3" aria-hidden="true">
            <VisualCard icon={<PackageCheck />} label="Assets" />
            <VisualCard icon={<ShieldCheck />} label="Secure" />
            <VisualCard icon={<KeyRound />} label="Access" />
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center p-5 sm:p-10 md:p-12">
          <div className="w-full max-w-md">
            <header className="mb-8 flex items-center gap-3 md:hidden">
              <div className="grid size-10 place-items-center rounded-lg bg-[#162A46] text-white">
                <Boxes className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#172033]">MIIT Store</p>
                <p className="text-xs text-[#64748B]">Management System</p>
              </div>
            </header>
            <div className="rounded-xl border border-[#DCE3ED] bg-[#FFFFFF] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-[#172033]">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  Sign in with your assigned MIIT Store account.
                </p>
              </div>
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#DC2626]"
                >
                  {error}
                </div>
              )}
              {challenge ? (
                <div
                  role="status"
                  className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-[#166534]"
                >
                  <p className="font-semibold">Verification code sent</p>
                  <p className="mt-1 leading-6">
                    A six-digit code was sent to your registered email. It
                    expires in {Math.ceil((challenge.expiresIn ?? 300) / 60)}{" "}
                    minutes. Continue with the verification step to complete
                    sign in.
                  </p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#172033]">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11 border-[#DCE3ED] pl-10 text-[#172033] focus-visible:ring-[#2563EB]"
                        placeholder="name@miit.edu.mm"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#172033]">
                      Password
                    </Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-11 border-[#DCE3ED] px-10 text-[#172033] focus-visible:ring-[#2563EB]"
                        placeholder="Enter your password"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#64748B] hover:bg-slate-100 hover:text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full bg-[#2563EB] text-sm font-semibold hover:bg-blue-700 focus-visible:ring-[#2563EB]"
                    disabled={loading}
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              )}
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-[#64748B]">
              Use only your assigned institutional account. Contact a system
              administrator if you need access.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
function VisualCard({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-[#203858] p-4">
      <div className="mb-5 text-blue-200">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
