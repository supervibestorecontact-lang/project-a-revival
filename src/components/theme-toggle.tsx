import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "delail-theme";

function apply(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    apply(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    localStorage.setItem(KEY, next);
  };

  const isDark = theme === "dark";
  const label = isDark ? "Gündüz modu" : "Gece modu";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${label}na geç`}
      title={label}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-[10px] font-medium text-foreground shadow-soft transition-transform active:scale-95"
    >
      {isDark ? (
        <Sun className="h-[17px] w-[17px] shrink-0 text-gold" />
      ) : (
        <Moon className="h-[17px] w-[17px] shrink-0 text-primary" />
      )}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
