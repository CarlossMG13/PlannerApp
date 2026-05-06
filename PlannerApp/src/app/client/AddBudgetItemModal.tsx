import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius } from "@/constants/theme";

type Props = {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onCreated: () => void;
};

const CATEGORIES = [
  "Catering",
  "Decoración",
  "Fotografía",
  "Música",
  "Venue",
  "Transporte",
  "Invitaciones",
  "Otro",
];

export function AddBudgetItemModal({ visible, eventId, onClose, onCreated }: Props) {
  const { getToken } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCategory(CATEGORIES[0]);
    setDescription("");
    setAmount("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!description.trim()) {
      setError("La descripción es requerida");
      return;
    }
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Ingresa un monto estimado válido");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/events/${eventId}/budget`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            description: description.trim(),
            estimatedAmount: numAmount,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al agregar el ítem");
        return;
      }
      reset();
      onCreated();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.sheetTitle}>Nuevo gasto</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={20} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Categoría</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContent}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: category === cat }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Ej. Menú para 150 personas"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              maxLength={200}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Monto estimado (MXN) *</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                maxLength={12}
              />
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.createBtn, loading && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Agregar gasto"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Agregar gasto</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.textMain },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 16,
  },
  categoryScroll: { marginHorizontal: -4 },
  categoryContent: { paddingHorizontal: 4, gap: 8 },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  categoryChipTextActive: { color: "#fff" },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textMain,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMulti: { height: 70, paddingTop: 12 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currencySymbol: { fontSize: 18, fontWeight: "700", color: colors.textMuted },
  amountInput: { flex: 1 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: radius.md,
  },
  errorText: { flex: 1, fontSize: 13, color: "#ef4444" },
  createBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
