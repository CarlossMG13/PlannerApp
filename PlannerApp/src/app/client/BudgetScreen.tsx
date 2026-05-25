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
import { colors, radius, shadow } from "@/constants/theme";
import { useBudget, BudgetItem, BudgetItemStatus } from "@/hooks/useBudget";
import { BudgetItemCard } from "./BudgetItemCard";
import { AddBudgetItemModal } from "./AddBudgetItemModal";

type Props = { eventId: string; onRefreshEvent?: () => void };

function formatMXN(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BudgetScreen({ eventId, onRefreshEvent }: Props) {
  const { items, summary, loading, error, refetch } = useBudget(eventId);
  const [showAdd, setShowAdd] = useState(false);

  const handleStatusChange = useCallback(
    (_itemId: string, _newStatus: BudgetItemStatus) => {
      refetch();
      onRefreshEvent?.();
    },
    [refetch, onRefreshEvent]
  );

  const liveActual = items
    .filter((it) => it.status === "CONFIRMED" || it.status === "PAID")
    .reduce((acc, it) => acc + Number(it.actualAmount || it.estimatedAmount), 0);

  const liveEstimated = items.reduce(
    (acc, it) => acc + Number(it.estimatedAmount),
    0
  );

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

  const remaining =
    summary?.totalBudget != null ? summary.totalBudget - liveActual : null;

  const budgetUsedPct =
    summary?.totalBudget && summary.totalBudget > 0
      ? Math.min((liveActual / summary.totalBudget) * 100, 100)
      : 0;

  return (
    <>
      {/* Summary card */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Presupuesto total</Text>
            <Text style={styles.summaryValue}>
              {formatMXN(summary?.totalBudget ?? null)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gasto real</Text>
            <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
              {formatMXN(liveActual)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Disponible</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    remaining !== null && remaining < 0 ? "#ef4444" : "#22c55e",
                },
              ]}
            >
              {formatMXN(remaining)}
            </Text>
          </View>
        </View>

        {summary?.totalBudget != null && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${budgetUsedPct}%` as any,
                  backgroundColor:
                    budgetUsedPct >= 100
                      ? "#ef4444"
                      : budgetUsedPct >= 80
                      ? "#f59e0b"
                      : "#22c55e",
                },
              ]}
            />
          </View>
        )}

        <Text style={styles.estimatedLabel}>
          Estimado: {formatMXN(liveEstimated)}
        </Text>
      </MotiView>

      {/* Header row */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300, delay: 80 }}
        style={styles.headerRow}
      >
        <Text style={styles.totalLabel}>
          {items.length === 0
            ? "Sin ítems"
            : `${items.length} ítem${items.length !== 1 ? "s" : ""}`}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAdd(true)}
          accessibilityRole="button"
          accessibilityLabel="Agregar gasto"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addBtnText}>Agregar gasto</Text>
        </TouchableOpacity>
      </MotiView>

      {items.length === 0 ? (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 120 }}
          style={styles.emptyState}
        >
          <View style={styles.emptyIconBox}>
            <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin gastos registrados</Text>
          <Text style={styles.emptySub}>
            Agrega ítems para controlar el presupuesto de tu evento.
          </Text>
        </MotiView>
      ) : (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 120 }}
          style={styles.listCard}
        >
          {items.map((item, i) => (
            <BudgetItemCard
              key={item.id}
              item={item}
              isLast={i === items.length - 1}
              onStatusChange={handleStatusChange}
            />
          ))}
        </MotiView>
      )}

      <AddBudgetItemModal
        visible={showAdd}
        eventId={eventId}
        onClose={() => setShowAdd(false)}
        onCreated={() => {
          setShowAdd(false);
          refetch();
          onRefreshEvent?.();
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

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.soft,
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  summaryValue: { fontSize: 15, fontWeight: "800", color: colors.textMain },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.border },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
  estimatedLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "right",
  },

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
});
