import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

export type UpcomingTask = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  event: { id: string; title: string };
};

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export function useUpcomingTasks() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await globalThis.fetch(`${BASE}/api/tasks/upcoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar tareas");
      setTasks(data.tasks ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { tasks, loading, error, refetch: fetch_ };
}
