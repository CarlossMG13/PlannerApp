import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { colors, radius, shadow } from "@/constants/theme";
import { useMyServices, MyService } from "@/hooks/useMyServices";

function formatPrice(price: string, currency: string) {
  return `${currency} $${Number(price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export function VendorServicesScreen() {
  const { services, loading, error, refetch, createService, updateService, deleteService } =
    useMyServices();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<MyService | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  };

  function openCreate() {
    setEditTarget(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setModalVisible(true);
  }

  function openEdit(service: MyService) {
    setEditTarget(service);
    setFormName(service.name);
    setFormDesc(service.description ?? "");
    setFormPrice(String(Number(service.basePrice)));
    setModalVisible(true);
  }

  async function handleSave() {
    const price = parseFloat(formPrice.replace(",", "."));
    if (!formName.trim() || isNaN(price) || price <= 0) {
      Alert.alert("Error", "Ingresa un nombre y precio válidos");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await updateService(editTarget.id, {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          basePrice: price,
        });
      } else {
        await createService({
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          basePrice: price,
        });
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(service: MyService) {
    Alert.alert(
      "Eliminar servicio",
      `¿Eliminar "${service.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteService(service.id);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mis Servicios</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </MotiView>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando servicios...</Text>
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
        ) : services.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          services.map((service, i) => (
            <MotiView
              key={service.id}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300, delay: i * 60 }}
            >
              <ServiceCard
                service={service}
                onEdit={() => openEdit(service)}
                onDelete={() => confirmDelete(service)}
              />
            </MotiView>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editTarget ? "Editar servicio" : "Nuevo servicio"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Nombre del servicio *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ej: Fotografía de bodas"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="¿Qué incluye este servicio?"
                placeholderTextColor={colors.textMuted}
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Precio base (MXN) *</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>$</Text>
                <TextInput
                  style={[styles.formInput, styles.priceInput]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={formPrice}
                  onChangeText={setFormPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (!formName.trim() || !formPrice) && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {editTarget ? "Guardar cambios" : "Agregar servicio"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: MyService;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {service.name}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={onEdit} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        {service.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {service.description}
          </Text>
        )}
        <View style={styles.priceChip}>
          <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
          <Text style={styles.priceText}>{formatPrice(service.basePrice, service.currency)}</Text>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 120 }}
      style={styles.emptyContainer}
    >
      <View style={styles.emptyIconCircle}>
        <Ionicons name="cube-outline" size={44} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Sin servicios aún</Text>
      <Text style={styles.emptySubtitle}>
        Publica tu primer servicio para que clientes y planners puedan encontrarte.
      </Text>
      <TouchableOpacity style={styles.emptyCtaBtn} activeOpacity={0.8} onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={styles.emptyCtaText}>Agregar primer servicio</Text>
      </TouchableOpacity>
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

  listContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    ...shadow.soft,
  },
  cardAccent: { width: 4, backgroundColor: colors.primary },
  cardContent: { flex: 1, padding: 14, gap: 6 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.textMain, marginRight: 8 },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  priceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  priceText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  emptyContainer: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.textMain, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
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

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.textMain },
  formField: { gap: 6 },
  formLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  formInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textMain,
  },
  formTextArea: {
    height: 80,
    paddingTop: 12,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceCurrency: { fontSize: 18, fontWeight: "700", color: colors.textMuted },
  priceInput: { flex: 1 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    marginTop: 4,
    ...shadow.primary,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
