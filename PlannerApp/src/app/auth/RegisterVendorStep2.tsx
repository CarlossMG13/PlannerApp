import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { colors, radius, shadow } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "RegisterVendorStep2"
  >;
};

const VENDOR_CATEGORIES = [
  { value: "CATERING", icon: "restaurant-outline" as const, label: "Catering" },
  { value: "PHOTOGRAPHY", icon: "camera-outline" as const, label: "Fotografía" },
  { value: "VIDEO", icon: "videocam-outline" as const, label: "Video" },
  { value: "MUSIC", icon: "musical-notes-outline" as const, label: "Música" },
  { value: "DECORATION", icon: "color-palette-outline" as const, label: "Decoración" },
  { value: "VENUE", icon: "home-outline" as const, label: "Salón / Venue" },
  { value: "FLOWERS", icon: "leaf-outline" as const, label: "Flores" },
  { value: "LIGHTING", icon: "flashlight-outline" as const, label: "Iluminación" },
  { value: "TRANSPORT", icon: "car-outline" as const, label: "Transporte" },
  { value: "BEAUTY", icon: "brush-outline" as const, label: "Belleza" },
  { value: "ENTERTAINMENT", icon: "happy-outline" as const, label: "Entretenimiento" },
  { value: "STATIONERY", icon: "mail-outline" as const, label: "Papelería" },
  { value: "SECURITY", icon: "shield-outline" as const, label: "Seguridad" },
  { value: "OTHER", icon: "ellipsis-horizontal-outline" as const, label: "Otro" },
];

const BIO_MAX = 200;

export function RegisterVendorStep2({ navigation }: Props) {
  const { mergeDraft } = useOnboardingDraft();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vendorBio, setVendorBio] = useState("");

  const canContinue =
    selectedCategory !== "" &&
    businessName.trim().length > 0 &&
    vendorBio.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    mergeDraft({ categoryName: selectedCategory, businessName, vendorBio });
    navigation.navigate("RegisterVendorStep3");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro Proveedor</Text>
        <View style={styles.headerSpacer} />
      </MotiView>

      {/* Progress */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 80 }}
      >
        <StepProgress steps={3} current={2} />
      </MotiView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <MotiView
          from={{ opacity: 0, translateX: -16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 450, delay: 150 }}
          style={styles.headline}
        >
          <Text style={styles.title}>Tu negocio{"\n"}en detalle</Text>
          <Text style={styles.subtitle}>
            Cuéntanos qué ofreces para conectarte con los eventos perfectos.
          </Text>
        </MotiView>

        {/* Categoría */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 250 }}
          style={styles.field}
        >
          <Text style={styles.label}>Categoría de servicio</Text>
          <View style={styles.categoryGrid}>
            {VENDOR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(cat.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </MotiView>

        {/* Nombre del negocio */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 350 }}
          style={styles.field}
        >
          <Text style={styles.label}>Nombre del Negocio</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="storefront-outline"
              size={18}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Fotografía Lumen Studio"
              placeholderTextColor={colors.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>
        </MotiView>

        {/* Bio corta */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 450 }}
          style={styles.field}
        >
          <Text style={styles.label}>Descripción breve</Text>
          <TextInput
            style={styles.bioInput}
            placeholder="¿Qué te hace especial? Cuéntalo en pocas palabras..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={BIO_MAX}
            value={vendorBio}
            onChangeText={setVendorBio}
            textAlignVertical="top"
          />
          <Text
            style={[
              styles.charCount,
              vendorBio.length >= BIO_MAX && styles.charCountLimit,
            ]}
          >
            {vendorBio.length}/{BIO_MAX}
          </Text>
        </MotiView>
      </ScrollView>

      {/* Bottom */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 550 }}
        style={styles.bottom}
      >
        <AppButton
          label="Continuar"
          onPress={handleContinue}
          style={{ opacity: canContinue ? 1 : 0.5 }}
          rightElement={
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          }
        />
        <Text style={styles.stepIndicator}>
          Paso 2 de 3: Perfil del Negocio
        </Text>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.textMain,
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
  headline: { marginTop: 8, marginBottom: 28 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  field: { marginBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 4,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  categoryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  categoryLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    ...shadow.soft,
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textMain,
  },
  bioInput: {
    minHeight: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    fontSize: 14,
    color: colors.textMain,
    lineHeight: 22,
    ...shadow.soft,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 4,
    marginRight: 4,
  },
  charCountLimit: { color: "#ef4444" },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: colors.background,
    ...shadow.soft,
  },
  stepIndicator: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
  },
});
