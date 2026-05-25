import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";

export type PlannerOption = {
  id: string;
  businessName: string | null;
  identityType: string;
  specialties: string[];
  coverageCities: string[];
  rating: number | null;
  user: { name: string; avatarUrl: string | null };
};

export function usePlanners() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [planners, setPlanners] = useState<PlannerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/planners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar planners");
        return;
      }
      setPlanners(data.planners ?? []);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanners();
  }, [fetchPlanners]);

  return { planners, loading, error, refetch: fetchPlanners };
}
