import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  LayoutDashboard,
  LibraryBig,
  LineChart,
  LogOut,
  Map,
  MessageSquare,
  Settings2,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string; icon: typeof Map; params?: Record<string, string> };

export function AppShell({
  children,
  goalId,
  title,
  actions,
}: {
  children: ReactNode;
  goalId?: string | null;
  title?: string;
  actions?: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const items: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    ...(goalId
      ? ([
          { label: "Roadmap", to: "/roadmap/$goalId", icon: Map, params: { goalId } },
          { label: "Session", to: "/session/$goalId", icon: BookOpen, params: { goalId } },
          { label: "Resources", to: "/resources/$goalId", icon: LibraryBig, params: { goalId } },
          { label: "Knowledge", to: "/knowledge/$goalId", icon: BookOpen, params: { goalId } },
          { label: "Tutor", to: "/tutor/$goalId", icon: MessageSquare, params: { goalId } },
          { label: "Progress", to: "/progress/$goalId", icon: LineChart, params: { goalId } },
        ] as NavItem[])
      : []),
    { label: "Explore", to: "/explore", icon: Compass },
    { label: "Goals", to: "/goals", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex">
          <Link to="/dashboard" className="mb-7 flex items-center gap-2 px-2">
            <Waves className="size-4 text-primary" strokeWidth={2.2} />
            <span className="display text-lg">Fathom</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-0.5">
            {items.map((item) => (
              <Link
                key={item.label + item.to}
                to={item.to}
                params={item.params as never}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                activeProps={{ className: "bg-sidebar-accent text-foreground" }}
                activeOptions={{ exact: false }}
              >
                <item.icon className="size-4" strokeWidth={1.8} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <Avatar className="size-7">
              <AvatarImage src={user?.user_metadata?.["avatar_url"] as string | undefined} />
              <AvatarFallback className="text-[10px]">
                {(user?.email ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-foreground">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur-md sm:px-8">
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
                <Waves className="size-4 text-primary" />
                <span className="display text-base">Fathom</span>
              </Link>
              {title ? (
                <h1 className="hidden text-sm font-medium text-foreground lg:block">{title}</h1>
              ) : null}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </header>
          <div className="px-5 py-6 sm:px-8 sm:py-8">{children}</div>
          <MobileNav items={items} />
        </main>
      </div>
    </div>
  );
}

function MobileNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="sticky bottom-0 z-20 flex items-center gap-1 overflow-x-auto border-t border-border bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
      {items.map((item) => (
        <Link
          key={"m" + item.label + item.to}
          to={item.to}
          params={item.params as never}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground",
          )}
          activeProps={{ className: "bg-secondary text-foreground" }}
        >
          <item.icon className="size-3.5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
