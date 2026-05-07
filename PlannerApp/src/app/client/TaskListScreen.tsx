import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius, shadow } from "@/constants/theme";
import { useTaskList, Task, TaskStatus } from "@/hooks/useTaskList";
import { CreateTaskModal, AssignableUser } from "./CreateTaskModal";

type Props = { eventId: string; canEdit?: boolean; assignableUsers?: AssignableUser[] };

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_WIDTH = Math.min(240, SCREEN_WIDTH * 0.72);
const COLUMN_GAP = 12;

const COLUMNS: {
  key: TaskStatus;
  label: string;
  color: string;
  bg: string;
  icon: any;
}[] = [
  { key: "TODO",        label: "Por hacer",  color: "#64748b", bg: "#f1f5f9", icon: "ellipse-outline" },
  { key: "IN_PROGRESS", label: "En progreso", color: "#d97706", bg: "#fffbeb", icon: "time-outline" },
  { key: "DONE",        label: "Completadas", color: "#16a34a", bg: "#f0fdf4", icon: "checkmark-circle" },
];

const PRIORITY_COLOR = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#ef4444" } as const;
const PRIORITY_LABEL = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" } as const;

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

export function TaskListScreen({ eventId, canEdit = true, assignableUsers = [] }: Props) {
  const { tasks, loading, error, refetch } = useTaskList(eventId);
  const [showCreate, setShowCreate] = useState(false);

  const handleStatusChange = useCallback(
    (_taskId: string, _newStatus: TaskStatus) => { refetch(); },
    [refetch]
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
        <TouchableOpacity style={styles.retryBtn} onPress={refetch} accessibilityRole="button">
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.headerRow}
      >
        <Text style={styles.totalLabel}>
          {tasks.length === 0 ? "Sin tareas" : `${tasks.length} tarea${tasks.length !== 1 ? "s" : ""}`}
        </Text>
        {canEdit ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreate(true)}
            accessibilityRole="button"
            accessibilityLabel="Nueva tarea"
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Nueva tarea</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readOnlyBadge}>
            <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
            <Text style={styles.readOnlyText}>Solo lectura</Text>
          </View>
        )}
      </MotiView>

      {tasks.length === 0 ? (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 100 }}
          style={styles.emptyState}
        >
          <View style={styles.emptyIconBox}>
            <Ionicons name="checkbox-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin tareas aún</Text>
          <Text style={styles.emptySub}>
            Crea tareas para coordinar cada detalle de tu evento.
          </Text>
        </MotiView>
      ) : (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 80 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={COLUMN_WIDTH + COLUMN_GAP}
            snapToAlignment="start"
            contentContainerStyle={styles.board}
          >
            {COLUMNS.map((col, ci) => {
              const items = tasks.filter((t) => t.status === col.key);
              return (
                <View key={col.key} style={[styles.column, ci === COLUMNS.length - 1 && { marginRight: 0 }]}>
                  {/* Column header */}
                  <View style={[styles.colHeader, { borderTopColor: col.color }]}>
                    <View style={[styles.colDot, { backgroundColor: col.color }]} />
                    <Text style={[styles.colTitle, { color: col.color }]}>{col.label}</Text>
                    <View style={[styles.colBadge, { backgroundColor: col.color + "22" }]}>
                      <Text style={[styles.colBadgeText, { color: col.color }]}>
                        {items.length}
                      </Text>
                    </View>
                  </View>

                  {/* Cards */}
                  <View style={styles.colBody}>
                    {items.length === 0 ? (
                      <View style={styles.colEmpty}>
                        <Text style={styles.colEmptyText}>Vacío</Text>
                      </View>
                    ) : (
                      items.map((task) => (
                        <KanbanCard
                          key={task.id}
                          task={task}
                          canEdit={canEdit}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </MotiView>
      )}

      {canEdit && (
        <CreateTaskModal
          visible={showCreate}
          eventId={eventId}
          assignableUsers={assignableUsers}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refetch(); }}
        />
      )}
    </>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────────────────

function KanbanCard({
  task,
  canEdit,
  onStatusChange,
}: {
  task: Task;
  canEdit: boolean;
  onStatusChange: (id: string, s: TaskStatus) => void;
}) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [updating, setUpdating] = useState(false);

  const priorityColor = PRIORITY_COLOR[task.priority];
  const isDone = task.status === "DONE";
  const overdue =
    task.dueDate !== null &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date();

  const handleCycle = async () => {
    if (updating) return;
    const next = STATUS_NEXT[task.status];
    setUpdating(true);
    try {
      const token = await getTokenRef.current();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      if (res.ok) onStatusChange(task.id, next);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: priorityColor }]}
      activeOpacity={canEdit ? 0.75 : 1}
      onPress={canEdit ? handleCycle : undefined}
      disabled={!canEdit || updating}
      accessibilityRole="button"
      accessibilityLabel={canEdit ? `Tarea: ${task.title}. Toca para avanzar estado.` : `Tarea: ${task.title}`}
    >
      {updating && (
        <View style={styles.cardOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]} numberOfLines={3}>
        {task.title}
      </Text>

      <View style={styles.cardMeta}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {PRIORITY_LABEL[task.priority]}
          </Text>
        </View>
        {task.dueDate ? (
          <View style={styles.dueDateRow}>
            <Ionicons
              name="calendar-outline"
              size={11}
              color={overdue ? "#ef4444" : colors.textMuted}
            />
            <Text style={[styles.dueDate, overdue && styles.dueDateOverdue]}>
              {new Date(task.dueDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
            </Text>
          </View>
        ) : null}
      </View>
      {task.assignedTo ? (
        <View style={styles.assigneeRow}>
          <Ionicons name="person-outline" size={11} color={colors.primary} />
          <Text style={styles.assigneeText} numberOfLines={1}>{task.assignedTo.name}</Text>
        </View>
      ) : null}

      {canEdit ? (
        <View style={styles.cardFooter}>
          <Ionicons name="swap-horizontal-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardHint}>toca para avanzar</Text>
        </View>
      ) : (
        <View style={styles.cardFooter}>
          <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardHint}>solo lectura</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 14, color: "#ef4444", textAlign: "center" },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: radius.md },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  readOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
    ...shadow.soft,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  board: {
    paddingBottom: 8,
    gap: COLUMN_GAP,
  },

  column: {
    width: COLUMN_WIDTH,
    marginRight: COLUMN_GAP,
  },

  colHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderTopWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    ...shadow.soft,
  },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { flex: 1, fontSize: 13, fontWeight: "700" },
  colBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  colBadgeText: { fontSize: 12, fontWeight: "700" },

  colBody: { gap: 8 },

  colEmpty: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  colEmptyText: { fontSize: 12, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderLeftWidth: 3,
    gap: 8,
    ...shadow.soft,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    zIndex: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: "600", color: colors.textMain, lineHeight: 18 },
  cardTitleDone: { textDecorationLine: "line-through", color: colors.textMuted },

  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  priorityBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: radius.sm },
  priorityText: { fontSize: 11, fontWeight: "700" },
  dueDateRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  dueDate: { fontSize: 11, color: colors.textMuted },
  dueDateOverdue: { color: "#ef4444", fontWeight: "600" },

  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 2, borderTopWidth: 1, borderTopColor: colors.border },
  cardHint: { fontSize: 10, color: colors.textMuted },

  assigneeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  assigneeText: { fontSize: 11, color: colors.primary, fontWeight: "600", flex: 1 },
});
