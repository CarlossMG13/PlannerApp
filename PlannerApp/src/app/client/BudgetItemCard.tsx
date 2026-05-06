import React, { memo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius, shadow } from "@/constants/theme";
import { BudgetItem, BudgetItemStatus } from "@/hooks/useBudget";

const STATUS_NEXT: Record<BudgetItemStatus, BudgetItemStatus> = {
  ESTIMATED: "CONFIRMED",
  CONFIRMED: "PAID",
  PAID: "ESTIMATED",
};

const STATUS_CONFIG: Record<
  BudgetItemStatus,
  { label: string; color: string; icon: string }
> = {
  ESTIMATED: { label: "Estimado", color: "#94a3b8", icon: "ellipse-outline" },
  CONFIRMED: { label: "Confirmado", color: "#f59e0b", icon: "checkmark-circle-outline" },
  PAID: { label: "Pagado", color: "#22c55e", icon: "checkmark-circle" },
};

type Props = {
  item: BudgetItem;
  isLast: boolean;
  onStatusChange: (itemId: string, newStatus: BudgetItemStatus) => void;
};

function formatMXN(value: string | number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export const BudgetItemCard = memo(function BudgetItemCard({
  item,
  isLast,
  onStatusChange,
}: Props) {
  const { getToken } = useAuth();
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[item.status];

  const handleStatusCycle = async () => {
    if (updating) return;
    const newStatus = STATUS_NEXT[item.status];
    setUpdating(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/budget/${item.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) onStatusChange(item.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const diff =
    item.actualAmount !== null
      ? Number(item.actualAmount) - Number(item.estimatedAmount)
      : null;

  return (
    <View style={[styles.card, isLast && styles.cardLast]}>
      <View style={styles.row}>
        {/* Status button */}
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={handleStatusCycle}
          disabled={updating}
          accessibilityRole="button"
          accessibilityLabel={`Estado: ${cfg.label}. Tocar para cambiar`}
        >
          {updating ? (
            <ActivityIndicator size="small" color={cfg.color} />
          ) : (
            <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}18` }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {/* Amounts */}
        <View style={styles.amounts}>
          <Text style={styles.estimated}>{formatMXN(item.estimatedAmount)}</Text>
          {item.actualAmount !== null ? (
            <Text
              style={[
                styles.actual,
                { color: diff !== null && diff > 0 ? "#ef4444" : "#22c55e" },
              ]}
            >
              {formatMXN(item.actualAmount)}
            </Text>
          ) : (
            <Text style={styles.actualEmpty}>Real: —</Text>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardLast: { borderBottomWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: { flex: 1, gap: 6 },
  description: { fontSize: 14, fontWeight: "600", color: colors.textMain, lineHeight: 20 },
  metaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: `${colors.primary}14`,
    borderRadius: radius.sm,
  },
  categoryText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  statusText: { fontSize: 11, fontWeight: "700" },
  amounts: { alignItems: "flex-end", gap: 2 },
  estimated: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  actual: { fontSize: 12, fontWeight: "600" },
  actualEmpty: { fontSize: 12, color: colors.textMuted },
});
