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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUserStore } from "@/store/userStore";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { useEvents, EventSummary, EventStatus } from "@/hooks/useEvents";
import { ClientStackParamList } from "@/navigation/types";
import { AssistantHeaderButton } from "@/components/assistant/AssistantHeaderButton";

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

type Nav = NativeStackNavigationProp<ClientStackParamList>;

export function ClientDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useUserStore();
  const { events, loading: eventsLoading, error: eventsError, refetch } = useEvents();

  const totalEvents = events.length;
  const completedEvents = events.filter((e) => e.status === "COMPLETED").length;
  const inProgressEvents = events.filter((e) =>
    (["ACTIVE", "IN_PROGRESS"] as EventStatus[]).includes(e.status)
  ).length;

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
            <Text style={styles.subGreeting}>¿Qué evento estás planeando?</Text>
          </View>
          <AssistantHeaderButton />
        </MotiView>

        {/* Stats row */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          style={styles.statsRow}
        >
          <StatCard icon="calendar-outline" label="Mis Eventos" value={String(totalEvents)} />
          <StatCard icon="checkmark-circle-outline" label="Completados" value={String(completedEvents)} />
          <StatCard icon="time-outline" label="En Progreso" value={String(inProgressEvents)} />
        </MotiView>

        {/* CTA crear evento */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <TouchableOpacity
            style={styles.ctaCard}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Crear nuevo evento"
            onPress={() => navigation.navigate("CreateEvent")}
          >
            <View style={styles.ctaIcon}>
              <Ionicons name="add-circle" size={32} color="#fff" />
            </View>
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Crear nuevo evento</Text>
              <Text style={styles.ctaSubtitle}>
                Bodas, corporativos, fiestas y más
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </MotiView>

        {/* Mis eventos */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 300 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Mis eventos</Text>

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
                <Ionicons name="calendar" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aún no tienes eventos</Text>
              <Text style={styles.emptySubtitle}>
                Crea tu primer evento y comienza a planear cada detalle.
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Crear primer evento"
                onPress={() => navigation.navigate("CreateEvent")}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.emptyCtaText}>Crear mi primer evento</Text>
              </TouchableOpacity>
            </View>
          )}
        </MotiView>

        {/* Tips */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Primeros pasos</Text>
          <TipRow icon="sparkles-outline" text="Crea tu evento y define fecha y lugar" />
          <TipRow icon="people-outline" text="Asigna un planner para coordinar todo" />
          <TipRow icon="cart-outline" text="Agrega proveedores: catering, música, fotos" />
          <TipRow icon="wallet-outline" text="Controla tu presupuesto en tiempo real" isLast />
        </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  const navigation = useNavigation<Nav>();
  const statusColor = STATUS_COLOR[event.status] ?? "#94a3b8";
  return (
    <TouchableOpacity
      style={[styles.eventRow, isLast && styles.eventRowLast]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Ver evento ${event.title}`}
      onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
    >
      <View style={[styles.eventStatusDot, { backgroundColor: statusColor }]} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventDate}>{formatDate(event.eventDate)}</Text>
      </View>
      <Text style={[styles.eventStatusText, { color: statusColor }]}>
        {STATUS_LABEL[event.status]}
      </Text>
    </TouchableOpacity>
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

function TipRow({ icon, text, isLast }: { icon: any; text: string; isLast?: boolean }) {
  return (
    <View style={[styles.tipRow, isLast && styles.tipRowLast]}>
      <View style={styles.tipIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 14,
  },

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

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tipRowLast: { borderBottomWidth: 0 },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textMain, lineHeight: 18 },

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
