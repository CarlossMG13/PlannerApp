import { create } from "zustand";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export type UserRole = "CLIENT" | "PLANNER" | "VENDOR" | "ADMIN";

export interface AppUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  clientProfile: Record<string, unknown> | null;
  plannerProfile: Record<string, unknown> | null;
  vendorProfile: Record<string, unknown> | null;
}

interface UserState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  fetchUser: (getToken: () => Promise<string | null>) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (getToken) => {
    set({ loading: true, error: null });
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching user");
      const data = await res.json();
      set({ user: data.user, loading: false });
    } catch {
      set({ error: "No se pudo cargar el perfil", loading: false });
    }
  },

  clearUser: () => set({ user: null, loading: false, error: null }),
}));
