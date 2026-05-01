import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useUserStore } from "@/store/userStore";
import { colors, radius, shadow } from "@/constants/theme";
import { useEvents, EventSummary, EventStatus } from "@/hooks/useEvents";

const firstName = (name: string) => name.split(" ")[0];

const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<EventStatus, string> = {
  DRAFT: "#94a3b8",
  ACTIVE: colors.primary,
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#3b82f6",
  CANCELLED: "#ef4444",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PlannerDashboardScreen() {
  const { user } = useUserStore();
  const { events, loading: eventsLoading, error: eventsError, refetch } = useEvents();

  const activeEvents = events.filter((e) => e.status === "ACTIVE").length;
  const inProgressEvents = events.filter((e) => e.status === "IN_PROGRESS").length;
  const completedEvents = events.filter((e) => e.status === "COMPLETED").length;

  const pendingTasksTotal = events.reduce(
    (sum, e) => sum + (e._count?.tasks ?? 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.greeting}>
              Hola, {user ? firstName(user.name) : ""}
            </Text>
            <Text style={styles.subGreeting}>Panel de planificación</Text>
          </View>
          <View style={styles.avatarBox}>
            <Ionicons name="briefcase" size={20} color={colors.primary} />
          </View>
        </MotiView>

        {/* Stats row */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          style={styles.statsRow}
        >
          <StatCard icon="calendar-outline" label="Activos" value={String(activeEvents)} />
          <StatCard icon="hourglass-outline" label="En Progreso" value={String(inProgressEvents)} />
          <StatCard icon="checkmark-done-outline" label="Completados" value={String(completedEvents)} />
        </MotiView>

        {/* Eventos asignados */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eventos asignados</Text>
            {events.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{events.length}</Text>
              </View>
            ) : (
              <View style={styles.badgeEmpty}>
                <Text style={styles.badgeEmptyText}>0</Text>
              </View>
            )}
          </View>

          {eventsLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : eventsError ? (
            <ErrorRow message={eventsError} onRetry={refetch} />
          ) : events.length > 0 ? (
            events.map((ev, i) => (
              <EventRow key={ev.id} event={ev} isLast={i === events.length - 1} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="albums" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin eventos asignados</Text>
              <Text style={styles.emptySubtitle}>
                Los eventos que los clientes te asignen aparecerán aquí.
              </Text>
            </View>
          )}
        </MotiView>

        {/* Tareas próximas */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 300 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tareas próximas</Text>
            {pendingTasksTotal > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingTasksTotal}</Text>
              </View>
            ) : (
              <View style={styles.badgeEmpty}>
                <Text style={styles.badgeEmptyText}>0</Text>
              </View>
            )}
          </View>

          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin tareas pendientes</Text>
            <Text style={styles.emptySubtitle}>
              Las tareas de tus eventos activos aparecerán aquí.
            </Text>
          </View>
        </MotiView>

        {/* Acciones rápidas */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            <ActionButton icon="people-outline" label="Proveedores" />
            <ActionButton icon="wallet-outline" label="Presupuesto" />
            <ActionButton icon="document-text-outline" label="Documentos" />
            <ActionButton icon="stats-chart-outline" label="Reportes" />
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry} accessibilityRole="button" accessibilityLabel="Reintentar">
        <Text style={styles.errorRetry}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EventRow({ event, isLast }: { event: EventSummary; isLast?: boolean }) {
  const statusColor = STATUS_COLOR[event.status] ?? "#94a3b8";
  const clientName = event.client?.user?.name;
  return (
    <TouchableOpacity
      style={[styles.eventRow, isLast && styles.eventRowLast]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Ver evento ${event.title}`}
    >
      <View style={[styles.eventStatusDot, { backgroundColor: statusColor }]} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventDate}>
          {clientName ? `${clientName} · ` : ""}{formatDate(event.eventDate)}
        </Text>
      </View>
      <Text style={[styles.eventStatusText, { color: statusColor }]}>
        {STATUS_LABEL[event.status]}
      </Text>
    </TouchableOpacity>
  );
}

function ActionButton({ icon, label }: { icon: any; label: string }) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: { fontSize: 24, fontWeight: "800", color: colors.textMain },
  subGreeting: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    alignItems: "center",
    gap: 4,
    ...shadow.soft,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.textMain },
  statLabel: { fontSize: 12, color: colors.textMuted, textAlign: "center", fontWeight: "600" },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadow.soft,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  badgeEmpty: {
    backgroundColor: colors.border,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeEmptyText: { fontSize: 11, fontWeight: "700", color: colors.textMuted },

  loadingRow: { paddingVertical: 24, alignItems: "center" },

  emptyState: { alignItems: "center", paddingVertical: 20, gap: 10 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventRowLast: { borderBottomWidth: 0 },
  eventStatusDot: { width: 10, height: 10, borderRadius: 5 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: "600", color: colors.textMain },
  eventDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  eventStatusText: { fontSize: 11, fontWeight: "700" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    width: "47%",
    backgroundColor: "#f8fafc",
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 12, fontWeight: "600", color: colors.textMain },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  errorText: { flex: 1, fontSize: 13, color: "#ef4444" },
  errorRetry: { fontSize: 13, fontWeight: "700", color: colors.primary },
});
