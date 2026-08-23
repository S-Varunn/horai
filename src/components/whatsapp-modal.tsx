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
import { Input } from "@/components/ui/input";
import {
  useGetWhatsAppStatus,
  useGetWhatsAppGatewayStatus,
  useGeneratePairingCode,
  useRequestGatewayCode,
  useUnlinkWhatsApp,
  type WhatsAppStatus,
  type WhatsAppGatewayStatus,
} from "@/lib/api-client";
import { MessageSquare, Copy, Check, Smartphone, Sparkles, RefreshCw, Unlink, ShieldCheck, QrCode, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumberLive, type CountryInfo } from "@/lib/phone-formatter";

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppModal({ open, onOpenChange }: WhatsAppModalProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);
  const [rawE164, setRawE164] = useState("");
  const [gatewayCode, setGatewayCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const { data: status, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>(useGetWhatsAppStatus());
  const { data: gateway, refetch: refetchGateway } = useQuery<WhatsAppGatewayStatus>(useGetWhatsAppGatewayStatus());

  const handlePhoneChange = (val: string) => {
    const res = formatPhoneNumberLive(val);
    setOwnerPhone(res.formatted);
    setDetectedCountry(res.country);
    setRawE164(res.cleanE164);
  };

  const generateMutation = useGeneratePairingCode({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      toast.success("New pairing code generated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate pairing code");
    },
  });

  const requestGatewayCodeMutation = useRequestGatewayCode({
    onSuccess: (data) => {
      setGatewayCode(data.code);
      toast.success("WhatsApp pairing code generated!");
    },
    onError: (err: any) => {
      const msg = err.data?.error || err.response?.data?.error || err.message || "Failed to generate code";
      toast.error(msg);
    },
  });

  const unlinkMutation = useUnlinkWhatsApp({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      toast.success("WhatsApp disconnected");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to disconnect WhatsApp");
    },
  });

  // Timer countdown
  useEffect(() => {
    if (!status?.expires_at) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(status.expires_at!).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status?.expires_at, queryClient]);

  // Poll status while open
  useEffect(() => {
    if (!open || status?.paired) return;
    const pollInterval = setInterval(() => {
      refetchStatus();
      refetchGateway();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [open, status?.paired, refetchStatus, refetchGateway]);

  const handleCopyText = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(msg);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleRequestOwnerCode = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPhone = rawE164 || ownerPhone.trim();
    if (!targetPhone || targetPhone.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }
    requestGatewayCodeMutation.mutate({ phone: targetPhone });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">WhatsApp Assistant</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage timesheets & events directly on WhatsApp
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isStatusLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking connection...</p>
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
                  {status.phone_number || status.whatsapp_phone}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/40">
              <p className="font-medium text-foreground">💡 How to chat with Horai:</p>
              <p className="text-[11px]">
                Prefix your messages with <span className="font-semibold text-primary">"Horai"</span>:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                <li><i>"Horai, whats the rate for Arangettram?"</i></li>
                <li><i>"Horai, how much do I owe everyone?"</i></li>
                <li><i>"Horai, log 4 hours on Arangettram for Sarah"</i></li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
              >
                <Unlink className="w-3.5 h-3.5 mr-1.5" />
                Disconnect WhatsApp
              </Button>
            </div>
          </div>
        ) : gateway?.is_owner === false && gateway?.status !== "connected" ? (
          /* Member View when Gateway is Not Yet Linked by Owner */
          <div className="space-y-4 py-6 text-center">
            <div className="p-5 rounded-xl bg-muted/30 border border-border/60 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-primary opacity-80" />
              <p className="font-medium text-foreground">WhatsApp Bot Not Connected Yet</p>
              <p className="text-xs text-muted-foreground">
                Your organizer has not connected the WhatsApp Bot yet. Please ask the organizer to link their WhatsApp in Horai first.
              </p>
            </div>
          </div>
        ) : gateway?.is_owner && gateway?.status !== "connected" ? (
          /* Owner Gateway Setup */
          <div className="space-y-4 py-2">
            {!showQr ? (
              <div className="space-y-4">
                {gatewayCode ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-2">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                        WhatsApp Pairing Code
                      </div>
                      <div className="flex justify-center gap-1.5 text-2xl sm:text-3xl font-mono font-bold tracking-widest text-primary">
                        {gatewayCode.split("").map((char, idx) => (
                          <span
                            key={idx}
                            className={`w-8 h-11 flex items-center justify-center rounded-lg bg-background border border-primary/30 shadow-inner ${
                              char === "-" ? "w-4 border-none bg-transparent" : ""
                            }`}
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="font-medium text-foreground">On your phone:</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                        <li>WhatsApp ➔ <b>Settings ➔ Linked Devices ➔ Link a Device</b></li>
                        <li>Tap <b>"Link with phone number instead"</b></li>
                        <li>Enter <b className="text-primary font-mono">{gatewayCode}</b></li>
                      </ol>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => handleCopyText(gatewayCode.replace("-", ""), "Copied pairing code!")}
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : `Copy Code: ${gatewayCode}`}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setGatewayCode(null)}
                      >
                        Change Number
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRequestOwnerCode} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-medium text-foreground">Phone Number</label>
                        {detectedCountry && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-in fade-in zoom-in-95 duration-150">
                            <span>{detectedCountry.flag}</span>
                            <span>{detectedCountry.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none">
                          {detectedCountry ? (
                            <span className="text-base select-none">{detectedCountry.flag}</span>
                          ) : (
                            <PhoneCall className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={ownerPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="pl-10 font-mono text-sm tracking-wide bg-background/50 focus:bg-background"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2 font-medium shadow-md shadow-primary/15"
                      disabled={requestGatewayCodeMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4" />
                      {requestGatewayCodeMutation.isPending ? "Connecting..." : "Get Pairing Code"}
                    </Button>
                  </form>
                )}

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQr(true)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR code instead
                  </button>
                </div>
              </div>
            ) : (
              /* QR Code fallback */
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <QrCode className="w-4 h-4" /> Scan QR via WhatsApp
                  </div>
                  {gateway?.qr_data_url ? (
                    <div className="flex justify-center p-2 bg-white rounded-xl shadow-lg w-48 h-48 mx-auto">
                      <img
                        src={gateway.qr_data_url}
                        alt="WhatsApp QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center mx-auto text-xs text-muted-foreground">
                      Generating QR...
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Open WhatsApp ➔ <b>Linked Devices</b> ➔ <b>Link a Device</b>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className="text-xs text-primary hover:underline"
                >
                  ← Use Phone Number
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Unpaired Member State */
          <div className="space-y-4 py-2">
            {status?.pairing_code && timeLeft !== null && timeLeft > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Your Pairing Code
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

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-primary" /> How to connect:
                  </div>
                  <p className="text-[11px]">
                    Send <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono font-semibold">PAIR {status.pairing_code}</code> to your organizer on WhatsApp.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleCopyText(`PAIR ${status.pairing_code}`, "Copied message!")}
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
              <div className="py-4 text-center space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-primary opacity-80" />
                  <p className="font-medium text-foreground">Link your personal WhatsApp number</p>
                  <p>
                    Generate a pairing code to connect your WhatsApp account to Horai.
                  </p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  <Sparkles className="w-4 h-4" />
                  {generateMutation.isPending ? "Generating..." : "Generate Pairing Code"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
