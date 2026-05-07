import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export type PlannerEntry = {
  id: string;
  plannerId: string;
  isLead: boolean;
  assignedAt: string;
  planner: { user: { name: string; avatarUrl: string | null } };
};

export type VendorEntry = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  agreedPrice: string | null;
  notes: string | null;
  vendor: {
    user: { id: string; name: string; avatarUrl: string | null };
    category: { name: string; icon: string | null };
  };
  service: { name: string; basePrice: string; currency: string } | null;
};

export type TaskEntry = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
};

export type BudgetEntry = {
  id: string;
  category: string;
  description: string;
  estimatedAmount: string;
  actualAmount: string | null;
  status: "ESTIMATED" | "CONFIRMED" | "PAID";
};

export type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  eventDate: string;
  endDate: string | null;
  venueName: string | null;
  venueAddress: string | null;
  guestCount: number | null;
  totalBudget: string | null;
  currency: string;
  client: { user: { id: string; name: string; email: string; avatarUrl: string | null } };
  planners: PlannerEntry[];
  vendors: VendorEntry[];
  tasks: TaskEntry[];
  budgetItems: BudgetEntry[];
  _count: { documents: number };
};

export function useEventDetail(eventId: string) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const res = await fetch(`${API_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`[${res.status}] ${data?.error ?? "Error al cargar el evento"}`);
      setEvent(data.event ?? null);
    } catch (e) {
      setError((e as Error).message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  return { event, loading, error, refetch: load };
}
