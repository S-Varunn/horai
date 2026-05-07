import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, ChevronDown, LogOut, User, LayoutDashboard, Home, Building2, ShieldCheck } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const activeTab = searchParams.get("tab") || "organizations";

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = [
    { 
      label: "Home", 
      icon: Home, 
      path: "/dashboard?tab=organizations", 
      active: (location === "/dashboard" && activeTab === "organizations") || location.startsWith("/orgs") || location.startsWith("/events")
    },
    { 
      label: "Security", 
      icon: ShieldCheck, 
      path: "/dashboard?tab=security", 
      active: location === "/dashboard" && activeTab === "security" 
    }, 
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            onClick={() => setLocation("/dashboard")}
            data-testid="link-home"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground tracking-tight text-lg">Horai</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
                data-testid="button-user-menu"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-semibold">
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="hidden sm:block max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 flex-1 pb-24 sm:pb-6 page-enter">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-6 py-3 flex items-center justify-between pb-safe">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </nav>
    </div>
  );
}
