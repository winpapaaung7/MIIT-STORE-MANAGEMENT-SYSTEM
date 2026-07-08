import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Lock, Mail, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export default function LoginPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleToggle = () => {
    setIsSignIn((current) => !current);
    setForm({ fullName: "", email: "", password: "" });
  };

  const handleChange = (
    field: "fullName" | "email" | "password",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(isSignIn ? "Signing in" : "Signing up", form);
    navigate("/inventory");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_60px_rgba(15,23,42,0.08)] md:grid md:grid-cols-[1.05fr_0.95fr] md:gap-0">
        <div className="relative overflow-hidden bg-emerald-900/95 p-10 text-white sm:p-12 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,253,245,0.55),_transparent_35%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/10">
                <ShoppingBag className="h-4 w-4" />
                MIIT Store Management
              </div>

              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">
                  Welcome to
                </p>
                <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Store management login
                </h2>
                <p className="max-w-xl text-sm text-emerald-100/90 sm:text-base">
                  Access your inventory, departments, and laptop rental tools
                  with secure store credentials or continue with Google.
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/15 bg-white/10 p-6 text-sm text-emerald-100 shadow-2xl shadow-black/10">
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Login with email</p>
                  <p className="text-xs text-emerald-100/75">
                    Fast access to your store dashboard.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Secure password</p>
                  <p className="text-xs text-emerald-100/75">
                    Protected workspace for your team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 md:p-14">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-600">
                {isSignIn ? "Sign in" : "Sign up"}
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                {isSignIn ? "Welcome back" : "Create your account"}
              </h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-50"
              onClick={handleToggle}
            >
              {isSignIn ? "Create account" : "Sign in"}
            </Button>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="secondary"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              <Globe className="h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative py-2 text-center text-xs text-slate-400">
              <span className="relative bg-white px-3">
                or continue with email
              </span>
            </div>
          </div>

          {isSignIn ? (
            <SignInForm
              email={form.email}
              password={form.password}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          ) : (
            <SignUpForm
              fullName={form.fullName}
              email={form.email}
              password={form.password}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            By continuing, you agree to the store terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
