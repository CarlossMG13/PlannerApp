import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";

export type VendorCategory = { id: string; name: string; icon: string | null };

export type VendorService = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  currency: string;
};

export type Vendor = {
  id: string;
  businessName: string;
  bio: string | null;
  rating: number | null;
  category: VendorCategory;
  services: VendorService[];
  user: { name: string };
};

export type EventVendorStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type EventVendorAssignment = {
  id: string;
  status: EventVendorStatus;
  agreedPrice: string | null;
  notes: string | null;
  assignedAt: string;
  vendor: {
    id: string;
    businessName: string;
    category: { name: string; icon: string | null };
  };
  service: { id: string; name: string; basePrice: string } | null;
};

export function useVendors(categoryId?: string) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const url = new URL(`${process.env.EXPO_PUBLIC_API_URL}/api/vendors`);
      if (categoryId) url.searchParams.set("categoryId", categoryId);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar proveedores");
        return;
      }
      setVendors(data.vendors);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refetch: fetchVendors };
}

export function useEventVendors(eventId: string) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [vendors, setVendors] = useState<EventVendorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/events/${eventId}/vendors`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar proveedores del evento");
        return;
      }
      setVendors(data.vendors);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refetch: fetchVendors };
}
