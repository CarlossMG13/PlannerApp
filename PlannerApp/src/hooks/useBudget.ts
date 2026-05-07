import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";

export type BudgetItemStatus = "ESTIMATED" | "CONFIRMED" | "PAID";

export type BudgetItem = {
  id: string;
  category: string;
  description: string;
  estimatedAmount: string;
  actualAmount: string | null;
  status: BudgetItemStatus;
  createdAt: string;
};

export type BudgetSummary = {
  totalBudget: number | null;
  currency: string;
  totalEstimated: number;
  totalActual: number;
};

export function useBudget(eventId: string) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [items, setItems] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/events/${eventId}/budget`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar el presupuesto");
        return;
      }
      setItems(data.items);
      setSummary(data.summary);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return { items, summary, loading, error, refetch: fetchBudget };
}
