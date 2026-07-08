import type { ChangeEvent, FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignUpFormProps {
  fullName: string;
  email: string;
  password: string;
  onChange: (field: "fullName" | "email" | "password", value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function SignUpForm({
  fullName,
  email,
  password,
  onChange,
  onSubmit,
}: SignUpFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-3">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("fullName", event.target.value)
          }
          placeholder="John Doe"
        />
      </div>

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
        <span className="text-slate-400">Secure sign up</span>
      </div>

      <Button
        type="submit"
        className="w-full rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        Create account
      </Button>
    </form>
  );
}
