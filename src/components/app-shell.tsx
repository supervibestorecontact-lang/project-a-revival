import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Clock,
  Compass,
  Home,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/app-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Ana Sayfa", icon: Home },
  { to: "/vakit", label: "Vakitler", icon: Clock },
  { to: "/oku", label: "Delâil", icon: BookOpen },
  { to: "/esma", label: "Esmâ", icon: Sparkles },
  { to: "/kible", label: "Kıble", icon: Compass },
];



export function StoreHydration() {
  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);
  return null;
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1 safe-bottom">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors"
            >
              <span
                className={cn(
                  "flex h-9 w-12 items-center justify-center rounded-full transition-all duration-300",
                  active
                    ? "bg-emerald-gradient text-primary-foreground shadow-soft"
                    : "text-muted-foreground group-hover:bg-accent",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-tight transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <StoreHydration />
      <main className={cn("mx-auto max-w-lg px-4 pb-28 pt-3", className)}>{children}</main>
      <BottomNav />
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl leading-tight text-gradient-emerald">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}
