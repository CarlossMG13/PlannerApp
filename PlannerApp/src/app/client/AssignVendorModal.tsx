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
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { colors, radius } from "@/constants/theme";
import { useVendors, Vendor, VendorService } from "@/hooks/useVendors";

type Props = {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onAssigned: () => void;
};

function formatMXN(value: string | number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function AssignVendorModal({ visible, eventId, onClose, onAssigned }: Props) {
  const { getToken } = useAuth();
  const { vendors, loading: loadingVendors } = useVendors();

  const [step, setStep] = useState<"select" | "configure">("select");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [selectedService, setSelectedService] = useState<VendorService | null>(null);
  const [agreedPrice, setAgreedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("select");
    setSearch("");
    setSelected(null);
    setSelectedService(null);
    setAgreedPrice("");
    setNotes("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectVendor = (vendor: Vendor) => {
    setSelected(vendor);
    setSelectedService(vendor.services[0] ?? null);
    setAgreedPrice(
      vendor.services[0] ? String(Number(vendor.services[0].basePrice)) : ""
    );
    setStep("configure");
  };

  const handleAssign = async () => {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      const price = parseFloat(agreedPrice.replace(/,/g, ""));
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/events/${eventId}/vendors`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendorId: selected.id,
            serviceId: selectedService?.id ?? null,
            agreedPrice: isNaN(price) ? null : price,
            notes: notes.trim() || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al asignar proveedor");
        return;
      }
      reset();
      onAssigned();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.businessName.toLowerCase().includes(search.toLowerCase()) ||
      v.category.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <View style={styles.headerLeft}>
              {step === "configure" && (
                <TouchableOpacity
                  onPress={() => setStep("select")}
                  style={styles.backBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Volver"
                >
                  <Ionicons name="arrow-back" size={18} color={colors.textMain} />
                </TouchableOpacity>
              )}
              <Text style={styles.sheetTitle}>
                {step === "select" ? "Buscar proveedor" : "Confirmar asignación"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={20} color={colors.textMain} />
            </TouchableOpacity>
          </View>

          {step === "select" ? (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o categoría..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {loadingVendors ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredVendors.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="business-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {vendors.length === 0
                      ? "No hay proveedores registrados"
                      : "Sin resultados para tu búsqueda"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredVendors}
                  keyExtractor={(v) => v.id}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.vendorRow}
                      onPress={() => handleSelectVendor(item)}
                      accessibilityRole="button"
                    >
                      <View style={styles.vendorIcon}>
                        <Text style={styles.vendorIconText}>
                          {item.category.icon ?? "🏢"}
                        </Text>
                      </View>
                      <View style={styles.vendorInfo}>
                        <Text style={styles.vendorName}>{item.businessName}</Text>
                        <Text style={styles.vendorCategory}>{item.category.name}</Text>
                        {item.rating != null && (
                          <Text style={styles.vendorRating}>
                            ★ {item.rating.toFixed(1)}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                  )}
                />
              )}
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selected vendor info */}
              <View style={styles.selectedCard}>
                <Text style={styles.selectedName}>{selected?.businessName}</Text>
                <Text style={styles.selectedCategory}>
                  {selected?.category.name}
                </Text>
              </View>

              {/* Service selector */}
              {selected && selected.services.length > 0 && (
                <>
                  <Text style={styles.label}>Servicio</Text>
                  {selected.services.map((svc) => (
                    <TouchableOpacity
                      key={svc.id}
                      style={[
                        styles.serviceRow,
                        selectedService?.id === svc.id && styles.serviceRowActive,
                      ]}
                      onPress={() => {
                        setSelectedService(svc);
                        setAgreedPrice(String(Number(svc.basePrice)));
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selectedService?.id === svc.id }}
                    >
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{svc.name}</Text>
                        {svc.description ? (
                          <Text style={styles.serviceDesc} numberOfLines={1}>
                            {svc.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.servicePrice}>
                        {formatMXN(svc.basePrice)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Text style={styles.label}>Precio acordado (MXN)</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={agreedPrice}
                  onChangeText={setAgreedPrice}
                  keyboardType="numeric"
                  maxLength={12}
                />
              </View>

              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Detalles del acuerdo..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                maxLength={300}
                textAlignVertical="top"
              />

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.assignBtn, loading && styles.assignBtnDisabled]}
                onPress={handleAssign}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Asignar proveedor"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.assignBtnText}>Asignar proveedor</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
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
    maxHeight: "90%",
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
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
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
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textMain,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  list: { flex: 1 },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  vendorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorIconText: { fontSize: 22 },
  vendorInfo: { flex: 1, gap: 2 },
  vendorName: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  vendorCategory: { fontSize: 13, color: colors.textMuted },
  vendorRating: { fontSize: 12, color: "#f59e0b", fontWeight: "600" },
  separator: { height: 1, backgroundColor: colors.border },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },

  selectedCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  selectedName: { fontSize: 16, fontWeight: "800", color: colors.textMain },
  selectedCategory: { fontSize: 13, color: colors.primary, marginTop: 2 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 16,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  serviceRowActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  serviceInfo: { flex: 1, gap: 2 },
  serviceName: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  serviceDesc: { fontSize: 12, color: colors.textMuted },
  servicePrice: { fontSize: 14, fontWeight: "700", color: colors.primary },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currencySymbol: { fontSize: 18, fontWeight: "700", color: colors.textMuted },
  amountInput: { flex: 1 },
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
  inputMulti: { height: 80, paddingTop: 12 },
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
  assignBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  assignBtnDisabled: { opacity: 0.6 },
  assignBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
