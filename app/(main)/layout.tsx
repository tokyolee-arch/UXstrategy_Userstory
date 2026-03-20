"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  PenSquare,
  List,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/stories/new", label: "스토리 작성", icon: PenSquare },
  { href: "/stories", label: "전체 목록", icon: List },
  { href: "/analytics", label: "분석", icon: BarChart3 },
];

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(
          user.user_metadata?.display_name || user.email || "사용자"
        );
      }
    });
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-lg font-bold tracking-tight">User Story</h1>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav pathname={pathname} />
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <div className="flex h-14 items-center px-4">
                  <h1 className="text-lg font-bold tracking-tight">
                    User Story
                  </h1>
                </div>
                <Separator />
                <SidebarNav pathname={pathname} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium md:hidden">User Story</span>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userEmail}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
