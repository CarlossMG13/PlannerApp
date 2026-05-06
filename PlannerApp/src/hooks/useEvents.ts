import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export type EventStatus = "DRAFT" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type VendorEntryStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type EventSummary = {
  id: string;
  title: string;
  type: string;
  status: EventStatus;
  eventDate: string;
  venueName: string | null;
  guestCount: number | null;
  currency: string;
  // CLIENT
  planners?: Array<{
    isLead: boolean;
    planner: { user: { name: string; avatarUrl: string | null } };
  }>;
  _count?: { tasks?: number; vendors?: number };
  // PLANNER
  client?: { user: { name: string; avatarUrl: string | null } };
  // VENDOR
  vendors?: Array<{ status: VendorEntryStatus; agreedPrice: string | null }>;
};

export function useEvents() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al cargar eventos");
        const data = await res.json();
        if (!cancelled) setEvents(data.events ?? []);
      } catch (e) {
        if (!cancelled) setError((e as Error).message ?? "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { events, loading, error, refetch };
}
