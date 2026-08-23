import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentChat, type AgentChatMessage } from "@/lib/api-client";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Clock,
  CalendarPlus,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface AIAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenWhatsAppModal?: () => void;
}

const STARTER_PROMPTS = [
  { label: "List events", icon: Clock, prompt: "List my events" },
  { label: "Create Event", icon: CalendarPlus, prompt: "Create event Gala on tomorrow at $30/hr" },
  { label: "Payroll Breakdown", icon: DollarSign, prompt: "Show payroll summary for my latest event" },
];

export default function AIAssistantDrawer({
  open,
  onOpenChange,
  onOpenWhatsAppModal,
}: AIAssistantDrawerProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      role: "assistant",
      content: "👋 Hi! I am your Horai AI Assistant. You can ask me to create events, manage live timers, log hours, or calculate payroll payouts. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useAgentChat({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      // If tools were executed that mutated data, invalidate queries to live-update the UI
      if (data.tools_used && data.tools_used.length > 0) {
        queryClient.invalidateQueries();
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${err.message || "Something went wrong while processing your request."}`,
        },
      ]);
    },
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || chatMutation.isPending) return;

    const userMessage: AgentChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    chatMutation.mutate({
      message: text,
      history: messages.filter((m, idx) => idx > 0), // exclude welcome msg
    });
  };

  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. What would you like to do next?",
      },
    ]);
  };

  // Simple Markdown-like formatter for bold and bullet points
  const formatMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      // Process bold **word**
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={pIdx} className="italic text-foreground">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <span key={lIdx} className="block min-h-[1.25rem]">
          {line.startsWith("• ") ? (
            <span className="flex items-start gap-1.5 pl-1">
              <span className="text-primary font-bold">•</span>
              <span>{formattedParts}</span>
            </span>
          ) : (
            formattedParts
          )}
        </span>
      );
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-50"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border bg-muted/20 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold flex items-center gap-1.5">
                AI Assistant
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                  Live
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Natural language event & timesheet actions
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Clear chat"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Message Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-br-sm shadow-md"
                    : "bg-muted/60 border border-border/80 text-foreground rounded-bl-sm"
                }`}
              >
                {formatMessageText(msg.content)}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 animate-pulse">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-muted/60 border border-border/80 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Thinking & executing actions...</span>
              </div>
            </div>
          )}
        </div>

        {/* Starter Chips */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/10 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {STARTER_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={chatMutation.isPending}
                className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all shrink-0 hover:shadow-xs active:scale-95 disabled:opacity-50"
              >
                <item.icon className="w-3 h-3 text-primary" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Banner */}
        {onOpenWhatsAppModal && (
          <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Also available on WhatsApp!
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-emerald-400 hover:text-emerald-300 font-semibold text-xs"
              onClick={() => {
                onOpenChange(false);
                onOpenWhatsAppModal();
              }}
            >
              Link Phone →
            </Button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. 'Create event...')"
              disabled={chatMutation.isPending}
              className="flex-1 bg-background text-sm h-10 border-border focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              className="h-10 w-10 shrink-0 bg-primary text-primary-foreground shadow-md hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
