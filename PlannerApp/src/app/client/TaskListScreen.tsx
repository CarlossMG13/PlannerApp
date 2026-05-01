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
import { useTaskList, Task, TaskStatus } from "@/hooks/useTaskList";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";

type Props = { eventId: string };

const STATUS_SECTIONS: {
  key: TaskStatus;
  label: string;
  color: string;
  icon: string;
}[] = [
  {
    key: "TODO",
    label: "Por hacer",
    color: "#94a3b8",
    icon: "ellipse-outline",
  },
  {
    key: "IN_PROGRESS",
    label: "En progreso",
    color: "#f59e0b",
    icon: "time-outline",
  },
  {
    key: "DONE",
    label: "Completadas",
    color: "#22c55e",
    icon: "checkmark-circle",
  },
];

export function TaskListScreen({ eventId }: Props) {
  const { tasks, loading, error, refetch } = useTaskList(eventId);
  const [showCreate, setShowCreate] = useState(false);

  const handleStatusChange = useCallback(
    (_taskId: string, _newStatus: TaskStatus) => {
      refetch();
    },
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

  const grouped = STATUS_SECTIONS.map((s) => ({
    ...s,
    items: tasks.filter((t) => t.status === s.key),
  }));

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
          {tasks.length === 0
            ? "Sin tareas"
            : `${tasks.length} tarea${tasks.length !== 1 ? "s" : ""}`}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Nueva tarea"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addBtnText}>Nueva tarea</Text>
        </TouchableOpacity>
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
        grouped.map((section, si) => {
          if (section.items.length === 0) return null;
          return (
            <MotiView
              key={section.key}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 350, delay: si * 80 }}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={section.icon as any}
                  size={14}
                  color={section.color}
                />
                <Text style={[styles.sectionTitle, { color: section.color }]}>
                  {section.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: `${section.color}18` },
                  ]}
                >
                  <Text style={[styles.countText, { color: section.color }]}>
                    {section.items.length}
                  </Text>
                </View>
              </View>
              {section.items.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isLast={i === section.items.length - 1}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </MotiView>
          );
        })
      )}

      <CreateTaskModal
        visible={showCreate}
        eventId={eventId}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
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

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { flex: 1, fontSize: 13, fontWeight: "700" },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countText: { fontSize: 12, fontWeight: "700" },
});
