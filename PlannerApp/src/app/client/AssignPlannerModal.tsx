import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius, shadow } from "@/constants/theme";

import { usePlanners, PlannerOption } from "@/hooks/usePlanners";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Props = {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onAssigned: () => void;
};

export function AssignPlannerModal({ visible, eventId, onClose, onAssigned }: Props) {
  const { getToken } = useAuth();
  const { planners, loading, error: fetchError, refetch } = usePlanners();
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSearch("");
      setError(null);
      refetch();
    }
  }, [visible, refetch]);

  const handleAssign = async (plannerId: string) => {
    setAssigning(plannerId);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/events/${eventId}/planners`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plannerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al asignar planner");
      }
      onAssigned();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAssigning(null);
    }
  };

  const filtered = planners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.user.name.toLowerCase().includes(q) ||
      (p.businessName ?? "").toLowerCase().includes(q) ||
      p.specialties.some((s) => s.toLowerCase().includes(q)) ||
      p.coverageCities.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Cerrar modal"
        />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Asignar Planner</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={20} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Nombre, negocio, especialidad o ciudad..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              accessibilityLabel="Buscar planner"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                accessibilityLabel="Limpiar búsqueda"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Error */}
          {(error || fetchError) ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error || fetchError}</Text>
            </View>
          ) : null}

          {/* List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando planners...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {search
                      ? "Sin resultados para tu búsqueda"
                      : "No hay planners registrados"}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <PlannerItem
                  item={item}
                  assigning={assigning}
                  onAssign={handleAssign}
                />
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PlannerItem({
  item,
  assigning,
  onAssign,
}: {
  item: PlannerOption;
  assigning: string | null;
  onAssign: (id: string) => void;
}) {
  const isLoading = assigning === item.id;
  const isDisabled = assigning !== null;

  return (
    <View style={styles.plannerItem}>
      <View style={styles.plannerAvatar}>
        <Ionicons name="person" size={20} color={colors.primary} />
      </View>
      <View style={styles.plannerInfo}>
        <Text style={styles.plannerName}>{item.user.name}</Text>
        {item.businessName ? (
          <Text style={styles.plannerBiz}>{item.businessName}</Text>
        ) : null}
        {item.specialties.length > 0 ? (
          <Text style={styles.plannerSpec} numberOfLines={1}>
            {item.specialties.slice(0, 3).join(" · ")}
          </Text>
        ) : null}
        {item.rating !== null ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.selectBtn, isDisabled && styles.selectBtnDisabled]}
        onPress={() => onAssign(item.id)}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={`Asignar a ${item.user.name}`}
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.selectBtnText}>Asignar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.textMain },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textMain,
    paddingVertical: 0,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { fontSize: 13, color: "#ef4444", flex: 1 },
  loadingBox: { paddingVertical: 40, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, color: colors.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 8 },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  plannerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  plannerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${colors.primary}30`,
  },
  plannerInfo: { flex: 1, gap: 2 },
  plannerName: { fontSize: 15, fontWeight: "600", color: colors.textMain },
  plannerBiz: { fontSize: 12, color: colors.textMuted },
  plannerSpec: { fontSize: 11, color: colors.primary, fontWeight: "500" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  ratingText: { fontSize: 11, color: "#f59e0b", fontWeight: "700" },
  selectBtn: {
    paddingHorizontal: 16,
    minWidth: 76,
    minHeight: 36,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBtnDisabled: { opacity: 0.6 },
  selectBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
