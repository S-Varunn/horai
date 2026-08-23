import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export const useJoinRequest = (options?: UseMutationOptions<any, any, { id: string }>) => {
  return useMutation({
    mutationFn: ({ id }) => 
      customFetch<any>(`/api/events/${id}/join-request`, { method: "POST" }),
    ...options,
  });
};

export const useReviewRequest = (options?: UseMutationOptions<any, any, { id: string; userId: string; status: "accepted" | "rejected" }>) => {
  return useMutation({
    mutationFn: ({ id, userId, status }) => 
      customFetch<any>(`/api/events/${id}/requests/${userId}`, { 
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" }
      }),
    ...options,
  });
};

export const useVerify2FA = (options?: UseMutationOptions<any, any, { userId: string; code: string }>) => {
  return useMutation({
    mutationFn: (data) => 
      customFetch<any>(`/api/auth/verify-2fa`, { 
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      }),
    ...options,
  });
};

export const useToggle2FA = (options?: UseMutationOptions<any, any, { enabled: boolean }>) => {
  return useMutation({
    mutationFn: (data) => 
      customFetch<any>(`/api/auth/2fa/toggle`, { 
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      }),
    ...options,
  });
};

export interface WhatsAppStatus {
  paired: boolean;
  phone_number: string | null;
  whatsapp_phone?: string | null;
  pairing_code: string | null;
  expires_at: string | null;
}

export interface WhatsAppGatewayStatus {
  status: "disconnected" | "qr_ready" | "connected";
  qr_raw: string | null;
  qr_data_url: string | null;
  connected_phone: string | null;
  is_owner?: boolean;
}

export interface PairingCodeResponse {
  code: string;
  expires_at: string;
  instructions: string;
}

export const useGetWhatsAppGatewayStatus = (enabled: boolean = false) => {
  return {
    queryKey: ["/api/whatsapp/gateway-status"],
    queryFn: () => customFetch<WhatsAppGatewayStatus>("/api/whatsapp/gateway-status"),
    enabled,
  };
};

export interface GatewayPairingCodeResponse {
  phone: string;
  code: string;
  raw_code: string;
}

export const useRequestGatewayCode = (
  options?: UseMutationOptions<GatewayPairingCodeResponse, any, { phone: string }>
) => {
  return useMutation({
    mutationFn: (variables: { phone: string }) =>
      customFetch<GatewayPairingCodeResponse>("/api/whatsapp/request-gateway-code", {
        method: "POST",
        body: JSON.stringify(variables),
        headers: { "Content-Type": "application/json" },
      }),
    ...options,
  });
};

export const useGetWhatsAppStatus = (enabled: boolean = false) => {
  return {
    queryKey: ["/api/whatsapp/status"],
    queryFn: () => customFetch<WhatsAppStatus>("/api/whatsapp/status"),
    enabled,
  };
};

export const useGeneratePairingCode = (options?: UseMutationOptions<PairingCodeResponse, any, void>) => {
  return useMutation({
    mutationFn: () =>
      customFetch<PairingCodeResponse>("/api/whatsapp/pairing-code", {
        method: "POST",
      }),
    ...options,
  });
};

export const useUnlinkWhatsApp = (options?: UseMutationOptions<any, any, void>) => {
  return useMutation({
    mutationFn: () =>
      customFetch<any>("/api/whatsapp/unlink", {
        method: "DELETE",
      }),
    ...options,
  });
};

export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentChatResponse {
  reply: string;
  tools_used?: Array<{ tool: string; args: any }>;
}

export const useAgentChat = (
  options?: UseMutationOptions<AgentChatResponse, any, { message: string; history?: AgentChatMessage[] }>
) => {
  return useMutation({
    mutationFn: (data) =>
      customFetch<AgentChatResponse>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    ...options,
  });
};

export interface DiscordStatus {
  paired: boolean;
  discord_user_id: string | null;
  discord_username: string | null;
  pairing_code: string | null;
  expires_at: string | null;
  bot_invite_url: string;
}

export const useGetDiscordStatus = () => {
  return {
    queryKey: ["/api/discord/status"],
    queryFn: () => customFetch<DiscordStatus>("/api/discord/status"),
  };
};

export const useGenerateDiscordPairingCode = (options?: UseMutationOptions<PairingCodeResponse, any, void>) => {
  return useMutation({
    mutationFn: () =>
      customFetch<PairingCodeResponse>("/api/discord/pairing-code", {
        method: "POST",
      }),
    ...options,
  });
};

export const useUnlinkDiscord = (options?: UseMutationOptions<any, any, void>) => {
  return useMutation({
    mutationFn: () =>
      customFetch<any>("/api/discord/unlink", {
        method: "DELETE",
      }),
    ...options,
  });
};

export const useDeleteOrganization = (options?: UseMutationOptions<any, any, { id: string }>) => {
  return useMutation({
    mutationFn: ({ id }) =>
      customFetch<any>(`/api/orgs/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};




