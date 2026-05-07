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
