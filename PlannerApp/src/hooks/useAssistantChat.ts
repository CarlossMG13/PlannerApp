import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from "@/store/userStore";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
};

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export function useAssistantChat(eventId?: string) {
  const { getToken } = useAuth();
  const { user } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idCounter = useRef(0);

  const nextId = () => String(++idCounter.current);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content: text.trim() };
    const loadingMsg: ChatMessage = { id: nextId(), role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setSending(true);
    setError(null);

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history, eventId }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));
        setError("Límite de consultas alcanzado. Intenta en una hora.");
        return;
      }

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));
        setError(data.error ?? "Error al contactar el asistente");
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: data.message, loading: false }
            : m
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));
      setError("Error de conexión. Verifica tu red e intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }, [messages, sending, getToken, eventId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const suggestedPrompts: Record<string, string[]> = {
    PLANNER: [
      "Necesito proveedores para 200 invitados, $180k MXN, boda",
      "¿Qué catering hay disponible para evento corporativo?",
      "Busca fotógrafo con presupuesto de $40k MXN",
    ],
    CLIENT: [
      "¿Cuál planner es ideal para mi boda de 150 invitados?",
      "Busca planner para evento corporativo, $200k MXN",
      "¿Qué planners tienen experiencia en bodas grandes?",
    ],
    VENDOR: [
      "¿Cuántos eventos por semana debería aceptar?",
      "¿Cómo está mi historial de servicios?",
      "Proyéctame mi rating si acepto 4 eventos por semana",
    ],
  };

  return {
    messages,
    sending,
    error,
    sendMessage,
    clearMessages,
    suggestedPrompts: suggestedPrompts[user?.role ?? "CLIENT"] ?? [],
  };
}
