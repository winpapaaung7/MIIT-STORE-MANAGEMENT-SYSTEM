import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={checked ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onClick}
      className={`relative h-8 w-14 rounded-full border shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${checked ? "border-sky-400 bg-sky-500" : "border-slate-500 bg-slate-700"}`}
    >
      <span className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#f8fafc] shadow-sm ring-1 ring-black/10 transition ${checked ? "left-7" : "left-1"}`}>
        {checked ? <Moon className="h-4 w-4 text-[#0f172a]" /> : <Sun className="h-4 w-4 text-amber-500" />}
      </span>
    </button>
  );
}

export default function Preferences() {
  const { language, setLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <section>
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">Preferences</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Adjust language and display settings.</p>
      </div>

      <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex items-center justify-between gap-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-slate-100">Language</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the language used in the system.</p>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-10 w-36 rounded-xl bg-slate-50 px-4 dark:bg-slate-800 dark:text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eng">English</SelectItem>
              <SelectItem value="mm">Myanmar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-slate-100">Theme</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Switch between light and dark appearance.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">{darkMode ? "Dark" : "Light"}</span>
            <ToggleSwitch checked={darkMode} onClick={() => setDarkMode((value) => !value)} />
          </div>
        </div>
      </div>
    </section>
  );
}
