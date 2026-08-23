import { useState } from "react";
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
import { useTheme } from "@/hooks/use-theme";
import {
  Clock,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Home,
  Building2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Bot,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import WhatsAppModal from "@/components/whatsapp-modal";
import DiscordModal from "@/components/discord-modal";
import AIAssistantDrawer from "@/components/ai-assistant-drawer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isDiscordOpen, setIsDiscordOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-200">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md shrink-0 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            onClick={() => setLocation("/dashboard")}
            data-testid="link-home"
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 text-primary-foreground">
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-bold text-foreground tracking-tight text-xl font-sans">
              Horai
            </span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Discord Bot Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDiscordOpen(true)}
              className="h-8 px-2.5 gap-1.5 text-xs text-[#5865F2] border-[#5865F2]/30 hover:bg-[#5865F2]/10 hover:text-[#5865F2] rounded-lg"
              title="Connect Discord Bot"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Discord</span>
            </Button>

            {/* WhatsApp Integration Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWhatsAppOpen(true)}
              className="h-8 px-2.5 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg"
              title="Connect WhatsApp Bot"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">WhatsApp</span>
            </Button>

            {/* AI Assistant Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAIOpen(true)}
              className="h-8 px-2.5 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 hover:text-primary rounded-lg"
              title="Open AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">AI Agent</span>
            </Button>

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg transition-transform active:scale-95"
              title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 transition-all rotate-0 scale-100" />
              ) : (
                <Moon className="w-4 h-4 text-primary transition-all rotate-0 scale-100" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-8 px-2 text-sm text-muted-foreground hover:text-foreground rounded-lg"
                  data-testid="button-user-menu"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] text-primary font-semibold">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate font-medium text-foreground">{user?.name}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDiscordOpen(true)} className="cursor-pointer">
                  <Bot className="w-4 h-4 mr-2 text-[#5865F2]" />
                  Discord Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsWhatsAppOpen(true)} className="cursor-pointer">
                  <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" />
                  WhatsApp Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Theme Selector Sub-options */}
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Theme
                </div>
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer text-xs">
                  <Sun className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Light Mode {theme === "light" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer text-xs">
                  <Moon className="w-3.5 h-3.5 mr-2 text-primary" />
                  Dark Mode {theme === "dark" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer text-xs">
                  <Laptop className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  System Default {theme === "system" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 flex-1 pb-24 sm:pb-6 page-enter">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border px-6 py-3 flex items-center justify-between pb-safe">
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
          onClick={() => setIsDiscordOpen(true)}
          className="flex flex-col items-center gap-1 text-[#5865F2] hover:opacity-80 transition-opacity"
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] font-medium">Discord</span>
        </button>
        <button
          onClick={() => setIsAIOpen(true)}
          className="flex flex-col items-center gap-1 text-primary hover:opacity-80 transition-opacity"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium">AI Agent</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </nav>

      {/* Floating AI Button (Desktop) */}
      <div className="hidden sm:block fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          onClick={() => setIsAIOpen(true)}
          className="rounded-full h-12 px-4 shadow-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-95 text-primary-foreground font-semibold gap-2 border border-white/10 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>AI Assistant</span>
        </Button>
      </div>

      {/* Modals & Drawers */}
      <WhatsAppModal
        open={isWhatsAppOpen}
        onOpenChange={setIsWhatsAppOpen}
      />
      <DiscordModal
        open={isDiscordOpen}
        onOpenChange={setIsDiscordOpen}
      />
      <AIAssistantDrawer
        open={isAIOpen}
        onOpenChange={setIsAIOpen}
        onOpenWhatsAppModal={() => setIsWhatsAppOpen(true)}
      />
    </div>
  );
}
