import { useState } from "react";
import { Moon, Sun } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ToggleSwitchProps {
  checked: boolean;
  onClick: () => void;
} 

function ToggleSwitch({
  checked,
  onClick,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={checked ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onClick}
      className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-200"
        }`}
    >
      <span
        className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition ${checked ? "left-7" : "left-1"
          }`}
      >
        {checked ? (
          <Moon className="h-4 w-4 text-slate-900" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
}

export default function Preferences() {
  const [language, setLanguage] = useState("eng");
  const [darkMode, setDarkMode] = useState(false);

  return (
    <section>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          Preferences
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Adjust language and display settings.
        </p>
      </div>

      <div className="mt-6 divide-y divide-slate-100">

        {/* Language */}

        <div className="flex items-center justify-between gap-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-950">
              Language
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Choose the language used in the system.
            </p>
          </div>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-10 w-36 rounded-xl bg-slate-50 px-4">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="eng">English</SelectItem>
              <SelectItem value="mm">Myanmar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}

        <div className="flex items-center justify-between gap-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-950">
              Theme
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Switch between light and dark appearance.
            </p>
          </div>

          <ToggleSwitch
            checked={darkMode}
            onClick={() => setDarkMode(!darkMode)}
          />
        </div>

      </div>
    </section>
  );
}