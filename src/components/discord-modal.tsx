import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useGetDiscordStatus,
  useGenerateDiscordPairingCode,
  useUnlinkDiscord,
  type DiscordStatus,
} from "@/lib/api-client";
import { Copy, Check, Sparkles, RefreshCw, Unlink, ExternalLink, Bot } from "lucide-react";
import { toast } from "sonner";

interface DiscordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DiscordModal({ open, onOpenChange }: DiscordModalProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: status, isLoading, refetch } = useQuery<DiscordStatus>(useGetDiscordStatus());

  const generateMutation = useGenerateDiscordPairingCode({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discord/status"] });
      toast.success("New 6-digit Discord code generated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate pairing code");
    },
  });

  const unlinkMutation = useUnlinkDiscord({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discord/status"] });
      toast.success("Discord disconnected successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to disconnect Discord");
    },
  });

  // Calculate timer countdown
  useEffect(() => {
    if (!status?.expires_at) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(status.expires_at!).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/discord/status"] });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status?.expires_at, queryClient]);

  // Poll status while modal is open to auto-detect pairing
  useEffect(() => {
    if (!open || status?.paired) return;
    const pollInterval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [open, status?.paired, refetch]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(`PAIR ${code}`);
    setCopied(true);
    toast.success("Copied to clipboard! Send this in Discord to the Horai Bot.");
    setTimeout(() => setCopied(false), 2500);
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const botInviteUrl = status?.bot_invite_url || "https://discord.com/oauth2/authorize?client_id=1540787285862125618&permissions=68608&integration_type=0&scope=bot";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Discord AI Assistant
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  24/7 Online
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage timesheets, start timers, and track payroll directly from Discord
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking Discord connection...</p>
          </div>
        ) : status?.paired ? (
          /* Paired State */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <div className="relative mt-0.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex-1 text-sm">
                <div className="font-semibold text-emerald-300">Connected & Active</div>
                <div className="text-xs text-emerald-200/80 font-mono mt-0.5">
                  Discord User: {status.discord_username || status.discord_user_id}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Try messaging your bot in Discord:
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• <i>"List my events"</i></p>
                <p>• <i>"Create event Gala on Friday for $30/hr"</i></p>
                <p>• <i>"Start timer for Gala"</i></p>
                <p>• <i>"Log 4.5 hours on Gala for Sarah"</i></p>
                <p>• <i>"Show payroll summary for Gala"</i></p>
              </div>
            </div>

            <div className="pt-2 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
              >
                <Unlink className="w-3.5 h-3.5 mr-1.5" />
                Disconnect Discord
              </Button>
            </div>
          </div>
        ) : (
          /* Unpaired State */
          <div className="space-y-4 py-2">
            {/* Step 1: Add Bot */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3">
              <div className="text-xs">
                <div className="font-semibold text-foreground">1. Invite Bot to Discord</div>
                <div className="text-muted-foreground">Add to your server or message in DM</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20 border-[#5865F2]/30"
                asChild
              >
                <a href={botInviteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Invite Bot
                </a>
              </Button>
            </div>

            {/* Step 2: Code */}
            {status?.pairing_code && timeLeft !== null && timeLeft > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    2. Your 6-Digit Discord Code
                  </div>
                  <div className="flex justify-center gap-1.5 text-2xl sm:text-3xl font-mono font-bold tracking-widest text-primary">
                    {status.pairing_code.split("").map((digit, idx) => (
                      <span
                        key={idx}
                        className="w-9 h-12 flex items-center justify-center rounded-lg bg-background/80 border border-primary/30 shadow-inner"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires in <span className="font-mono font-semibold text-foreground">{formatMinutes(timeLeft)}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground">
                    3. Send this message in Discord:
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border font-mono text-center text-sm font-semibold text-primary">
                    PAIR {status.pairing_code}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Send in a DM to <b>Horai Assistant#1925</b> or mention <code>@Horai Assistant PAIR {status.pairing_code}</code> in your server.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleCopyCode(status.pairing_code!)}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy 'PAIR " + status.pairing_code + "'"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Generate new code"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center space-y-4">
                <Button
                  className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-[#5865F2]/20"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  <Sparkles className="w-4 h-4" />
                  {generateMutation.isPending ? "Generating..." : "Generate 6-Digit Discord PIN"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
