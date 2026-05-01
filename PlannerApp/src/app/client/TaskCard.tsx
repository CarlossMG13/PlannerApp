import React, { memo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius } from "@/constants/theme";
import { Task, TaskStatus, TaskPriority } from "@/hooks/useTaskList";

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

const STATUS_ICON: Record<TaskStatus, string> = {
  TODO: "ellipse-outline",
  IN_PROGRESS: "time-outline",
  DONE: "checkmark-circle",
};

const STATUS_ICON_COLOR: Record<TaskStatus, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#f59e0b",
  DONE: "#22c55e",
};

// Cycles TODO → IN_PROGRESS → DONE → TODO
const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

function formatDueDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

type Props = {
  task: Task;
  isLast?: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
};

export const TaskCard = memo(function TaskCard({ task, isLast, onStatusChange }: Props) {
  const { getToken } = useAuth();
  const [updating, setUpdating] = useState(false);
  const priorityColor = PRIORITY_COLOR[task.priority];
  const isDone = task.status === "DONE";
  const overdue =
    task.dueDate !== null &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date();

  const handleToggleStatus = async () => {
    if (updating) return;
    const newStatus = STATUS_NEXT[task.status];
    setUpdating(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) {
        onStatusChange(task.id, newStatus);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isLast && styles.containerLast,
        { borderLeftColor: priorityColor },
      ]}
    >
      <TouchableOpacity
        style={styles.statusBtn}
        onPress={handleToggleStatus}
        disabled={updating}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar estado: ${task.title}`}
      >
        {updating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons
            name={STATUS_ICON[task.status] as any}
            size={24}
            color={STATUS_ICON_COLOR[task.status]}
          />
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: `${priorityColor}18` },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {PRIORITY_LABEL[task.priority]}
            </Text>
          </View>
          {task.dueDate ? (
            <View style={styles.dueDateRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={overdue ? "#ef4444" : colors.textMuted}
              />
              <Text style={[styles.dueDate, overdue && styles.dueDateOverdue]}>
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderLeftWidth: 3,
    gap: 10,
  },
  containerLast: { borderBottomWidth: 0 },
  statusBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 4 },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  priorityText: { fontSize: 11, fontWeight: "700" },
  dueDateRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  dueDate: { fontSize: 11, color: colors.textMuted },
  dueDateOverdue: { color: "#ef4444", fontWeight: "600" },
});
