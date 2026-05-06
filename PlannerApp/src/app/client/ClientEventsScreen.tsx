import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEvents, EventSummary, EventStatus } from "@/hooks/useEvents";
import { colors, radius, shadow } from "@/constants/theme";
import { ClientStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ClientStackParamList>;

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

type FilterKey = "ALL" | EventStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "ACTIVE", label: "Activos" },
  { key: "IN_PROGRESS", label: "En progreso" },
  { key: "COMPLETED", label: "Completados" },
  { key: "DRAFT", label: "Borradores" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ClientEventsScreen() {
  const navigation = useNavigation<Nav>();
  const { events, loading, error, refetch } = useEvents();
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const filtered =
    filter === "ALL" ? events : events.filter((e) => e.status === filter);

  const onRefresh = async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mis Eventos</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("CreateEvent")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </MotiView>

      {/* Filtros */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 350, delay: 80 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </MotiView>

      {/* Contenido */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando eventos...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Ocurrió un error</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            filter={filter}
            onCreateEvent={() => navigation.navigate("CreateEvent")}
          />
        ) : (
          filtered.map((ev, i) => (
            <MotiView
              key={ev.id}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300, delay: i * 50 }}
            >
              <EventCard
                event={ev}
                onPress={() => navigation.navigate("EventDetail", { eventId: ev.id })}
              />
            </MotiView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({
  event,
  onPress,
}: {
  event: EventSummary;
  onPress: () => void;
}) {
  const statusColor = STATUS_COLOR[event.status] ?? "#94a3b8";
  const tasksCount = event._count?.tasks ?? 0;
  const vendorsCount = event._count?.vendors ?? 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={onPress}>
      {/* Status bar */}
      <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABEL[event.status]}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(event.eventDate)}</Text>
          </View>
          {event.venueName && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.venueName}
              </Text>
            </View>
          )}
          {event.guestCount != null && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{event.guestCount} invitados</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.countChip}>
            <Ionicons name="checkmark-done-outline" size={13} color={colors.textMuted} />
            <Text style={styles.countText}>{tasksCount} tareas</Text>
          </View>
          <View style={styles.countChip}>
            <Ionicons name="storefront-outline" size={13} color={colors.textMuted} />
            <Text style={styles.countText}>{vendorsCount} proveedores</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({
  filter,
  onCreateEvent,
}: {
  filter: FilterKey;
  onCreateEvent: () => void;
}) {
  const isFiltered = filter !== "ALL";

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 120 }}
      style={styles.emptyContainer}
    >
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name={isFiltered ? "filter-outline" : "calendar-outline"}
          size={44}
          color={colors.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {isFiltered
          ? `Sin eventos "${STATUS_LABEL[filter as EventStatus] ?? filter}"`
          : "Aún no tienes eventos"}
      </Text>

      <Text style={styles.emptySubtitle}>
        {isFiltered
          ? "Prueba con otro filtro o crea un nuevo evento."
          : "Crea tu primer evento y comienza a organizar cada detalle con tu planner y proveedores."}
      </Text>

      {!isFiltered && (
        <TouchableOpacity
          style={styles.emptyCtaBtn}
          activeOpacity={0.8}
          onPress={onCreateEvent}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.emptyCtaText}>Crear mi primer evento</Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.textMain },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },

  filtersRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  filterTextActive: { color: "#fff" },

  listContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    ...shadow.soft,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 8 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: colors.textMuted, flex: 1 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  countChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },

  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textMain,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadow.primary,
  },
  emptyCtaText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // States
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 14, color: colors.textMuted },
  errorTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  errorSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
