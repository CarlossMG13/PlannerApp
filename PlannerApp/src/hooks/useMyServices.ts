import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

export type MyService = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  currency: string;
};

const BASE = process.env.EXPO_PUBLIC_API_URL;

export function useMyServices() {
  const { getToken } = useAuth();
  const [services, setServices] = useState<MyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/vendors/me/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al cargar servicios"); return; }
      setServices(data.services);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const createService = useCallback(async (payload: {
    name: string;
    description?: string;
    basePrice: number;
    currency?: string;
  }) => {
    const token = await getToken();
    const res = await fetch(`${BASE}/api/vendors/me/services`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al crear servicio");
    setServices((prev) => [...prev, data.service]);
    return data.service as MyService;
  }, [getToken]);

  const updateService = useCallback(async (id: string, payload: Partial<{
    name: string;
    description: string;
    basePrice: number;
    currency: string;
  }>) => {
    const token = await getToken();
    const res = await fetch(`${BASE}/api/vendors/me/services/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al actualizar servicio");
    setServices((prev) => prev.map((s) => (s.id === id ? data.service : s)));
    return data.service as MyService;
  }, [getToken]);

  const deleteService = useCallback(async (id: string) => {
    const token = await getToken();
    const res = await fetch(`${BASE}/api/vendors/me/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Error al eliminar servicio");
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, [getToken]);

  return { services, loading, error, refetch: fetchServices, createService, updateService, deleteService };
}
