import React from "react";
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
import { useUserStore } from "@/store/userStore";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { useEvents, EventSummary } from "@/hooks/useEvents";

const firstName = (name: string) => name.split(" ")[0];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function VendorDashboardScreen() {
  const { user } = useUserStore();
  const { events, loading: eventsLoading, error: eventsError, refetch } = useEvents();

  const pendingEvents = events.filter(
    (e) => e.vendors?.[0]?.status === "PENDING"
  ).length;
  const confirmedEvents = events.filter(
    (e) => e.vendors?.[0]?.status === "CONFIRMED"
  ).length;
  const servicesCount = (user?.vendorProfile as any)?._count?.services ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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
            <Text style={styles.subGreeting}>Panel de proveedor</Text>
          </View>
          <View style={styles.avatarBox}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
          </View>
        </MotiView>

        {/* Stats row */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          style={styles.statsRow}
        >
          <StatCard icon="cube-outline" label="Servicios" value={String(servicesCount)} />
          <StatCard icon="mail-unread-outline" label="Solicitudes" value={String(pendingEvents)} />
          <StatCard icon="checkmark-circle-outline" label="Activos" value={String(confirmedEvents)} />
        </MotiView>

        {/* CTA agregar servicio */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <TouchableOpacity
            style={styles.ctaCard}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Agregar nuevo servicio"
          >
            <View style={styles.ctaIcon}>
              <Ionicons name="add-circle" size={32} color="#fff" />
            </View>
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Agregar servicio</Text>
              <Text style={styles.ctaSubtitle}>
                Catering, fotografía, música y más
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </MotiView>

        {/* Eventos en que participa */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 300 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis eventos</Text>
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
                <Ionicons name="cube" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin servicios publicados</Text>
              <Text style={styles.emptySubtitle}>
                Agrega tu primer servicio para que los clientes puedan encontrarte.
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Publicar primer servicio"
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.emptyCtaText}>Publicar mi primer servicio</Text>
              </TouchableOpacity>
            </View>
          )}
        </MotiView>

        {/* Solicitudes pendientes */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 400 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
            {pendingEvents > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingEvents}</Text>
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
          ) : pendingEvents > 0 ? (
            events
              .filter((e) => e.vendors?.[0]?.status === "PENDING")
              .map((ev, i, arr) => (
                <EventRow key={ev.id} event={ev} isLast={i === arr.length - 1} />
              ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="mail-unread" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin solicitudes nuevas</Text>
              <Text style={styles.emptySubtitle}>
                Cuando un cliente te contacte, aparecerá aquí.
              </Text>
            </View>
          )}
        </MotiView>

        {/* Acciones rápidas */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 500 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            <ActionButton icon="pricetag-outline" label="Mis precios" />
            <ActionButton icon="calendar-outline" label="Disponibilidad" />
            <ActionButton icon="chatbubble-outline" label="Mensajes" />
            <ActionButton icon="stats-chart-outline" label="Estadísticas" />
          </View>
        </MotiView>
        </View>
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
  const vendorStatus = event.vendors?.[0]?.status;
  const statusColor =
    vendorStatus === "CONFIRMED" ? colors.primary
    : vendorStatus === "PENDING" ? "#f59e0b"
    : "#94a3b8";
  const statusLabel =
    vendorStatus === "CONFIRMED" ? "Confirmado"
    : vendorStatus === "PENDING" ? "Pendiente"
    : "Cancelado";

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
          {event.client?.user?.name ? `${event.client.user.name} · ` : ""}
          {formatDate(event.eventDate)}
        </Text>
      </View>
      <Text style={[styles.eventStatusText, { color: statusColor }]}>
        {statusLabel}
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
  content: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8, ...centered },

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

  ctaCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    ...shadow.primary,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  ctaSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },

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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 14,
  },
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
  emptyCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  emptyCtaText: { fontSize: 13, fontWeight: "700", color: colors.primary },

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
