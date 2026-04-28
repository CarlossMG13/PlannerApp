import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export function useApiClient() {
  const { getToken, signOut } = useAuth();

  const apiFetch = useCallback(
    async <T>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken();

      const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers as Record<string, string>),
        },
      });

      if (response.status === 401) {
        await signOut();
        throw new Error("Sesión expirada");
      }

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Error en la solicitud" }));
        throw new Error(err.error ?? "Error en la solicitud");
      }

      return response.json() as Promise<T>;
    },
    [getToken, signOut],
  );

  return { apiFetch };
}
