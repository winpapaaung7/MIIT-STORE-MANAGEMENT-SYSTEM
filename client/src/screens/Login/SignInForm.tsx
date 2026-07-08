import type { ChangeEvent, FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  email: string;
  password: string;
  onChange: (field: "email" | "password", value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function SignInForm({
  email,
  password,
  onChange,
  onSubmit,
}: SignInFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-3">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("email", event.target.value)
          }
          placeholder="john@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("password", event.target.value)
          }
          placeholder="Enter your password"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <a href="#" className="text-emerald-600 hover:text-emerald-700">
          Forgot password?
        </a>
      </div>

      <Button
        type="submit"
        className="w-full rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        Sign in
      </Button>
    </form>
  );
}
