import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import * as ImagePicker from "expo-image-picker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { RootStackParamList } from "@/navigation/types";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "RegisterPlannerStep3"
  >;
};

const BUDGET_RANGES = [
  { label: "Menos de $5,000", value: "1" },
  { label: "$5,000 - $15,000", value: "2" },
  { label: "$15,000 - $50,000", value: "3" },
  { label: "$50,000 - $100,000", value: "4" },
  { label: "Más de $100,000", value: "5" },
];

const BIO_MAX = 250;

export function RegisterPlannerStep3({ navigation }: Props) {
  const { mergeDraft } = useOnboardingDraft();

  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [showBudget, setShowBudget] = useState(false);
  const [bio, setBio] = useState("");

  const canContinue = budgetRange !== "" && bio.trim().length > 0;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu galería para subir el portafolio.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPortfolioImages((prev) => [...prev, ...uris].slice(0, 10));
    }
  };

  const removeImage = (uri: string) => {
    setPortfolioImages((prev) => prev.filter((i) => i !== uri));
  };

  const selectedBudgetLabel = BUDGET_RANGES.find(
    (b) => b.value === budgetRange,
  )?.label;

  const handleContinue = () => {
    if (!canContinue) return;
    mergeDraft({ portfolioImages, budgetRange, bio });
    navigation.navigate("RegisterPlannerStep4");
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
        <Text style={styles.headerTitle}>Registro Planner</Text>
        <View style={styles.headerSpacer} />
      </MotiView>

      {/* Progress */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 80 }}
      >
        <StepProgress steps={4} current={3} />
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
          <Text style={styles.title}>Muestra tu trabajo</Text>
          <Text style={styles.subtitle}>
            Sube tu portafolio y define tu rango de presupuesto para que los
            clientes ideales te encuentren.
          </Text>
        </MotiView>

        {/* Portafolio */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 250 }}
          style={styles.field}
        >
          <Text style={styles.label}>Subir Portafolio</Text>

          {portfolioImages.length === 0 ? (
            <TouchableOpacity
              onPress={pickImages}
              activeOpacity={0.8}
              style={styles.uploadZone}
            >
              <View style={styles.uploadIconBox}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.uploadTitle}>Toca para subir</Text>
              <Text style={styles.uploadSubtitle}>Imágenes (Máx. 10)</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.imageGrid}>
                {portfolioImages.map((uri) => (
                  <View key={uri} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(uri)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {portfolioImages.length < 10 && (
                  <TouchableOpacity
                    onPress={pickImages}
                    style={styles.addMoreBtn}
                  >
                    <Ionicons name="add" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.imageCount}>
                {portfolioImages.length}/10 imágenes
              </Text>
            </View>
          )}
        </MotiView>

        {/* Rango de presupuesto */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 350 }}
          style={styles.field}
        >
          <Text style={styles.label}>Rango de presupuesto que gestionas</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowBudget(!showBudget)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.pickerText,
                !budgetRange && styles.pickerPlaceholder,
              ]}
            >
              {selectedBudgetLabel || "Selecciona un rango"}
            </Text>
            <Ionicons
              name={showBudget ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showBudget && (
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 200 }}
              style={styles.dropdown}
            >
              {BUDGET_RANGES.map((b) => (
                <TouchableOpacity
                  key={b.value}
                  style={[
                    styles.dropdownItem,
                    budgetRange === b.value && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setBudgetRange(b.value);
                    setShowBudget(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      budgetRange === b.value && styles.dropdownTextSelected,
                    ]}
                  >
                    {b.label}
                  </Text>
                  {budgetRange === b.value && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </MotiView>
          )}
          <Text style={styles.hint}>
            Esto ayuda a filtrar clientes según su presupuesto disponible.
          </Text>
        </MotiView>

        {/* Bio */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 450 }}
          style={styles.field}
        >
          <Text style={styles.label}>Breve Bio Profesional</Text>
          <TextInput
            style={styles.bioInput}
            placeholder="Cuéntanos sobre tu experiencia, estilo y lo que te hace único como Planner..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={BIO_MAX}
            value={bio}
            onChangeText={setBio}
            textAlignVertical="top"
          />
          <Text
            style={[
              styles.charCount,
              bio.length >= BIO_MAX && styles.charCountLimit,
            ]}
          >
            {bio.length}/{BIO_MAX}
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
          Paso 3 de 4: Portafolio y Tarifas
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16, ...centered },
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
  uploadZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  uploadIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMain,
    marginBottom: 4,
  },
  uploadSubtitle: { fontSize: 12, color: colors.textMuted },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  imageWrapper: {
    position: "relative",
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: radius.sm,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  addMoreBtn: {
    width: 90,
    height: 90,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  imageCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    marginLeft: 4,
  },
  pickerButton: {
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
  pickerText: { flex: 1, fontSize: 14, color: colors.textMain },
  pickerPlaceholder: { color: colors.textMuted },
  dropdown: {
    marginTop: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadow.soft,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: { backgroundColor: "#f0fdf4" },
  dropdownText: { fontSize: 14, color: colors.textMain },
  dropdownTextSelected: { color: colors.primary, fontWeight: "600" },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    marginLeft: 4,
  },
  bioInput: {
    minHeight: 110,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepIndicator: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
  },
});




