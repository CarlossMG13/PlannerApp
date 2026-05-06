import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import {
  useEventDetail,
  EventDetail,
  PlannerEntry,
} from "@/hooks/useEventDetail";
import { AssignPlannerModal } from "./AssignPlannerModal";
import { TaskListScreen } from "./TaskListScreen";
import { BudgetScreen } from "./BudgetScreen";
import { VendorListScreen } from "./VendorListScreen";
import { ClientStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ClientStackParamList>;
type RouteT = RouteProp<ClientStackParamList, "EventDetail">;

const EVENT_TYPE_LABEL: Record<string, string> = {
  WEDDING: "Boda",
  CORPORATE: "Corporativo",
  BIRTHDAY: "Cumpleaños",
  SOCIAL: "Social",
  OTHER: "Otro",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#94a3b8",
  ACTIVE: colors.primary,
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#3b82f6",
  CANCELLED: "#ef4444",
};

type Tab = "resumen" | "tareas" | "presupuesto" | "proveedores";

const TABS: { key: Tab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "tareas", label: "Tareas" },
  { key: "presupuesto", label: "Presupuesto" },
  { key: "proveedores", label: "Proveedores" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount: string | null, currency: string) {
  if (!amount) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function EventDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { eventId } = route.params;
  const { event, loading, error, refetch } = useEventDetail(eventId);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.errorCenter}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error ?? "Evento no encontrado"}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLOR[event.status] ?? "#94a3b8";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABEL[event.status]}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </MotiView>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {activeTab === "resumen" && (
            <ResumeTab
              event={event}
              onAssignPlanner={() => setShowPlannerModal(true)}
              onPlannerRemoved={refetch}
            />
          )}
          {activeTab === "tareas" && (
            <TaskListScreen eventId={event.id} />
          )}
          {activeTab === "presupuesto" && (
            <BudgetScreen eventId={event.id} />
          )}
          {activeTab === "proveedores" && (
            <VendorListScreen eventId={event.id} />
          )}
        </View>
      </ScrollView>

      <AssignPlannerModal
        visible={showPlannerModal}
        eventId={event.id}
        onClose={() => setShowPlannerModal(false)}
        onAssigned={() => {
          setShowPlannerModal(false);
          refetch();
        }}
      />
    </SafeAreaView>
  );
}

// ─── Resume Tab ───────────────────────────────────────────────────────────────

function ResumeTab({
  event,
  onAssignPlanner,
  onPlannerRemoved,
}: {
  event: EventDetail;
  onAssignPlanner: () => void;
  onPlannerRemoved: () => void;
}) {
  return (
    <>
      {/* Event info */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Información del evento</Text>
        <InfoRow
          icon="pricetag-outline"
          label="Tipo"
          value={EVENT_TYPE_LABEL[event.type] ?? event.type}
        />
        <InfoRow
          icon="calendar-outline"
          label="Fecha"
          value={formatDate(event.eventDate)}
        />
        {event.venueName ? (
          <InfoRow icon="location-outline" label="Lugar" value={event.venueName} />
        ) : null}
        {event.venueAddress ? (
          <InfoRow icon="map-outline" label="Dirección" value={event.venueAddress} />
        ) : null}
        {event.guestCount !== null ? (
          <InfoRow
            icon="people-outline"
            label="Invitados"
            value={`${event.guestCount} personas`}
          />
        ) : null}
        {event.totalBudget ? (
          <InfoRow
            icon="wallet-outline"
            label="Presupuesto"
            value={formatCurrency(event.totalBudget, event.currency)}
            isLast
          />
        ) : null}
        {event.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descLabel}>Descripción</Text>
            <Text style={styles.descText}>{event.description}</Text>
          </View>
        ) : null}
      </MotiView>

      {/* Planner */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350, delay: 80 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Planner asignado</Text>
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={onAssignPlanner}
            accessibilityRole="button"
            accessibilityLabel="Asignar planner"
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.assignBtnText}>Asignar</Text>
          </TouchableOpacity>
        </View>

        {event.planners.length === 0 ? (
          <View style={styles.emptyPlanner}>
            <Ionicons name="person-add-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyPlannerText}>Sin planner asignado</Text>
            <Text style={styles.emptyPlannerSub}>
              Asigna un planner para coordinar tu evento
            </Text>
          </View>
        ) : (
          event.planners.map((ep, i) => (
            <PlannerRow
              key={ep.id}
              entry={ep}
              isLast={i === event.planners.length - 1}
              eventId={event.id}
              onRemoved={onPlannerRemoved}
            />
          ))
        )}
      </MotiView>

      {/* Quick stats */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350, delay: 160 }}
        style={styles.quickStatsRow}
      >
        <QuickStat
          icon="checkbox-outline"
          label="Tareas"
          value={String(event.tasks.length)}
          color="#6366f1"
        />
        <QuickStat
          icon="wallet-outline"
          label="Gastos"
          value={String(event.budgetItems.length)}
          color="#f59e0b"
        />
        <QuickStat
          icon="briefcase-outline"
          label="Proveedores"
          value={String(event.vendors.length)}
          color="#3b82f6"
        />
        <QuickStat
          icon="document-outline"
          label="Docs"
          value={String(event._count.documents)}
          color="#8b5cf6"
        />
      </MotiView>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: any;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function PlannerRow({
  entry,
  isLast,
  eventId,
  onRemoved,
}: {
  entry: PlannerEntry;
  isLast: boolean;
  eventId: string;
  onRemoved: () => void;
}) {
  const { getToken } = useAuth();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const token = await getToken();
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/events/${eventId}/planners/${entry.plannerId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      onRemoved();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <View style={[styles.plannerRow, isLast && styles.plannerRowLast]}>
      <View style={styles.plannerAvatar}>
        <Ionicons name="person" size={18} color={colors.primary} />
      </View>
      <View style={styles.plannerInfo}>
        <Text style={styles.plannerName}>{entry.planner.user.name}</Text>
        {entry.isLead && (
          <View style={styles.leadBadge}>
            <Text style={styles.leadText}>Principal</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={handleRemove}
        disabled={removing}
        accessibilityRole="button"
        accessibilityLabel="Quitar planner"
      >
        {removing ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
        )}
      </TouchableOpacity>
    </View>
  );
}

function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.quickStat, { borderTopColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function PlaceholderTab({
  icon,
  label,
  subtitle,
}: {
  icon: any;
  label: string;
  subtitle: string;
}) {
  return (
    <View style={styles.placeholderTab}>
      <View style={styles.placeholderIconBox}>
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>
      <Text style={styles.placeholderTitle}>{label}</Text>
      <Text style={styles.placeholderSub}>{subtitle}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: { fontSize: 15, color: "#ef4444", textAlign: "center" },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCenter: { flex: 1, gap: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain },
  headerRight: { width: 44 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  tabLabelActive: { color: colors.primary },

  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40, ...centered },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 14,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  assignBtnText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { marginTop: 1 },
  infoLabel: {
    width: 90,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  infoValue: { flex: 1, fontSize: 13, color: colors.textMain, fontWeight: "600" },

  descBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  descLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, marginBottom: 4 },
  descText: { fontSize: 13, color: colors.textMain, lineHeight: 20 },

  emptyPlanner: { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyPlannerText: { fontSize: 14, fontWeight: "600", color: colors.textMain },
  emptyPlannerSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  plannerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  plannerRowLast: { borderBottomWidth: 0 },
  plannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${colors.primary}30`,
  },
  plannerInfo: { flex: 1, gap: 4 },
  plannerName: { fontSize: 14, fontWeight: "600", color: colors.textMain },
  leadBadge: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}18`,
  },
  leadText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  removeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    ...shadow.soft,
  },
  quickStatValue: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  quickStatLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600", textAlign: "center" },

  placeholderTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  placeholderIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  placeholderTitle: { fontSize: 18, fontWeight: "700", color: colors.textMain },
  placeholderSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
