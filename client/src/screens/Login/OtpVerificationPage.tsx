import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, MailCheck, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, type AuthenticatedUser } from "@/auth/AuthContext";
import { API_BASE_URL as API } from "@/lib/api";
type ChallengeState = {
  challengeId: string;
  email: string;
  expiresIn: number;
  resendAfter: number;
};
type ApiResult = {
  ok?: boolean;
  accessToken?: string;
  user?: AuthenticatedUser;
  challengeId?: string;
  expiresIn?: number;
  resendAfter?: number;
  message?: string;
};
const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  return !domain
    ? email
    : `${name.slice(0, 1)}${"*".repeat(Math.max(3, name.length - 1))}@${domain}`;
};
const formatTime = (value: number) =>
  `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
export default function OtpVerificationPage() {
  const navigate = useNavigate(),
    location = useLocation(),
    { signIn } = useAuth();
  const initial = location.state as ChallengeState | null;
  const [challenge, setChallenge] = useState<ChallengeState | null>(
    initial?.challengeId ? initial : null,
  );
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [expiry, setExpiry] = useState(initial?.expiresIn ?? 0),
    [resend, setResend] = useState(initial?.resendAfter ?? 0);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [resending, setResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (!initial?.challengeId) navigate("/login", { replace: true });
  }, [initial?.challengeId, navigate]);
  useEffect(() => {
    if (!expiry) return;
    const timer = window.setInterval(
      () => setExpiry((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [expiry]);
  useEffect(() => {
    if (!resend) return;
    const timer = window.setInterval(
      () => setResend((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resend]);
  function backToLogin() {
    setChallenge(null);
    setDigits(["", "", "", "", "", ""]);
    navigate("/login", { replace: true });
  }
  function applyDigits(value: string, start = 0) {
    const numbers = value
      .replace(/\D/g, "")
      .slice(0, 6 - start)
      .split("");
    if (!numbers.length) return;
    setDigits((current) => {
      const next = [...current];
      numbers.forEach((digit, index) => {
        next[start + index] = digit;
      });
      return next;
    });
    const destination = Math.min(start + numbers.length, 5);
    window.setTimeout(() => inputs.current[destination]?.focus(), 0);
  }
  async function verify() {
    const otp = digits.join("");
    if (!challenge || otp.length !== 6 || loading) {
      if (otp.length !== 6)
        setError("Enter the complete six-digit verification code.");
      return;
    }
    if (!expiry) {
      setError("This verification code has expired. Request a new code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challengeId: challenge.challengeId, otp }),
      });
      const payload = (await response.json()) as ApiResult;
      if (!response.ok || !payload.accessToken || !payload.user)
        throw new Error(payload.message ?? "Unable to verify code.");
      signIn(payload.accessToken, payload.user);
      setChallenge(null);
      setDigits(["", "", "", "", "", ""]);
      navigate(
        payload.user.role.code === "LAPTOP_RENTAL" ? "/laptop-rental" : "/",
        { replace: true },
      );
    } catch (requestError) {
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function resendCode() {
    if (!challenge || resend || resending) return;
    setResending(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challengeId: challenge.challengeId }),
      });
      const payload = (await response.json()) as ApiResult;
      if (!response.ok || !payload.challengeId)
        throw new Error(payload.message ?? "Unable to resend code.");
      setChallenge((current) =>
        current
          ? {
              ...current,
              challengeId: payload.challengeId!,
              expiresIn: payload.expiresIn ?? 300,
              resendAfter: payload.resendAfter ?? 60,
            }
          : current,
      );
      setExpiry(payload.expiresIn ?? 300);
      setResend(payload.resendAfter ?? 60);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Network error. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }
  if (!challenge) return null;
  return (
    <main className="auth-page min-h-screen bg-[#F4F7FB] p-4 sm:p-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-lg items-center justify-center">
        <div className="auth-card w-full rounded-2xl border border-[#DCE3ED] bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={backToLogin}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <ArrowLeft className="size-4" />
            Back to Login
          </button>
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-blue-50 text-[#2563EB]">
              <MailCheck className="size-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#172033]">
              Verify Your Account
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              We sent a 6-digit verification code to your email.
            </p>
            <p className="mt-1 text-sm font-medium text-[#172033]">
              {maskEmail(challenge.email)}
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
          <div className="space-y-5">
            <div>
              <div
                className="flex justify-center gap-2"
                onPaste={(event) => {
                  event.preventDefault();
                  applyDigits(event.clipboardData.getData("text"));
                }}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      inputs.current[index] = node;
                    }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Verification digit ${index + 1}`}
                    value={digit}
                    disabled={loading || !expiry}
                    maxLength={1}
                    onChange={(event) => applyDigits(event.target.value, index)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Backspace" &&
                        !digits[index] &&
                        index > 0
                      )
                        inputs.current[index - 1]?.focus();
                      if (event.key === "Enter") void verify();
                    }}
                    className="size-11 rounded-lg border border-[#DCE3ED] text-center text-lg font-semibold text-[#172033] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-[#64748B]">
                {expiry
                  ? `Code expires in ${formatTime(expiry)}`
                  : "Code expired. Request a new code."}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => void verify()}
              disabled={loading || !expiry || digits.join("").length !== 6}
              className="h-11 w-full bg-[#2563EB] font-semibold hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify and Sign In"
              )}
            </Button>
            <div className="border-t border-[#DCE3ED] pt-5 text-center text-sm text-[#64748B]">
              <p>Didn’t receive a code?</p>
              <Button
                type="button"
                variant="link"
                onClick={() => void resendCode()}
                disabled={Boolean(resend) || resending}
                className="mt-1 h-auto p-0 font-semibold text-[#2563EB]"
              >
                {resending
                  ? "Sending…"
                  : resend
                    ? `Resend Code in ${formatTime(resend)}`
                    : "Resend Code"}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-[#64748B]">
              <ShieldCheck className="size-4 text-[#16A34A]" />
              Your verification code is protected.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
