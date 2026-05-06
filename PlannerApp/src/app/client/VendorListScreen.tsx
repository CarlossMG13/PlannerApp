import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius, shadow } from "@/constants/theme";
import { useEventVendors, EventVendorAssignment, EventVendorStatus } from "@/hooks/useVendors";
import { AssignVendorModal } from "./AssignVendorModal";

type Props = { eventId: string };

const STATUS_CONFIG: Record<
  EventVendorStatus,
  { label: string; color: string; icon: string }
> = {
  PENDING: { label: "Pendiente", color: "#94a3b8", icon: "time-outline" },
  CONFIRMED: { label: "Confirmado", color: "#22c55e", icon: "checkmark-circle" },
  CANCELLED: { label: "Cancelado", color: "#ef4444", icon: "close-circle" },
};

const STATUS_NEXT: Record<EventVendorStatus, EventVendorStatus> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "CANCELLED",
  CANCELLED: "PENDING",
};

function formatMXN(value: string | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function VendorCard({
  item,
  eventId,
  isLast,
  onStatusChange,
}: {
  item: EventVendorAssignment;
  eventId: string;
  isLast: boolean;
  onStatusChange: () => void;
}) {
  const { getToken } = useAuth();
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[item.status];

  const handleCycle = async () => {
    if (updating) return;
    const newStatus = STATUS_NEXT[item.status];
    setUpdating(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/events/${eventId}/vendors/${item.vendor.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) onStatusChange();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.card, isLast && styles.cardLast]}>
      <View style={styles.cardRow}>
        <View style={styles.cardIconBox}>
          <Text style={styles.cardIcon}>
            {item.vendor.category.icon ?? "🏢"}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{item.vendor.businessName}</Text>
          <Text style={styles.cardCategory}>{item.vendor.category.name}</Text>
          {item.service && (
            <Text style={styles.cardService}>{item.service.name}</Text>
          )}
          <View style={styles.cardMeta}>
            {item.agreedPrice && (
              <Text style={styles.cardPrice}>
                {formatMXN(item.agreedPrice)}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: `${cfg.color}18` }]}
              onPress={handleCycle}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel={`Estado: ${cfg.label}`}
            >
              {updating ? (
                <ActivityIndicator size="small" color={cfg.color} />
              ) : (
                <>
                  <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {item.notes ? (
            <Text style={styles.cardNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function VendorListScreen({ eventId }: Props) {
  const { vendors, loading, error, refetch } = useEventVendors(eventId);
  const [showAssign, setShowAssign] = useState(false);

  const handleStatusChange = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={refetch}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Header row */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.headerRow}
      >
        <Text style={styles.totalLabel}>
          {vendors.length === 0
            ? "Sin proveedores"
            : `${vendors.length} proveedor${vendors.length !== 1 ? "es" : ""}`}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAssign(true)}
          accessibilityRole="button"
          accessibilityLabel="Asignar proveedor"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addBtnText}>Asignar</Text>
        </TouchableOpacity>
      </MotiView>

      {vendors.length === 0 ? (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 100 }}
          style={styles.emptyState}
        >
          <View style={styles.emptyIconBox}>
            <Ionicons name="briefcase-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin proveedores asignados</Text>
          <Text style={styles.emptySub}>
            Busca y asigna proveedores para tu evento.
          </Text>
        </MotiView>
      ) : (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 80 }}
          style={styles.listCard}
        >
          {vendors.map((v, i) => (
            <VendorCard
              key={v.id}
              item={v}
              eventId={eventId}
              isLast={i === vendors.length - 1}
              onStatusChange={handleStatusChange}
            />
          ))}
        </MotiView>
      )}

      <AssignVendorModal
        visible={showAssign}
        eventId={eventId}
        onClose={() => setShowAssign(false)}
        onAssigned={() => {
          setShowAssign(false);
          refetch();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  errorText: { fontSize: 14, color: "#ef4444", textAlign: "center" },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardLast: { borderBottomWidth: 0 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: { fontSize: 22 },
  cardContent: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  cardCategory: { fontSize: 12, color: colors.textMuted },
  cardService: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    minWidth: 44,
    minHeight: 28,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardNotes: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
});
