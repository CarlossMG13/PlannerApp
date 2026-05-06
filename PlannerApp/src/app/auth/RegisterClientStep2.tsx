import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { GuestRangeCard } from "@/components/ui/GuestRangeCard";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { RootStackParamList } from "@/navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "RegisterClientStep2"
  >;
};

import { MEXICO_STATES } from "@/constants/mexicoStates";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";

const GUEST_RANGES = [
  { label: "10 - 50", sublabel: "Ãntimo", value: "10-50" },
  { label: "50 - 150", sublabel: "Estándar", value: "50-150" },
  { label: "150 - 300", sublabel: "Grande", value: "150-300" },
  { label: "300+", sublabel: "Masivo", value: "300+" },
];

export function RegisterClientStep2({ navigation }: Props) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [guestRange, setGuestRange] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { mergeDraft } = useOnboardingDraft();

  const canContinue =
    name.trim().length > 0 && city !== "" && guestRange !== "";

  const handleContinue = () => {
    if (!canContinue) return;
    mergeDraft({ name, preferredCity: city, preferredGuestRange: guestRange });
    navigation.navigate("RegisterClientStep3");
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
        <Text style={styles.headerTitle}>Registro Cliente</Text>
        <View style={styles.headerSpacer} />
      </MotiView>

      {/* Progress */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 80 }}
      >
        <StepProgress steps={4} current={2} />
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
          <Text style={styles.title}>Cuéntanos un poco{"\n"}sobre ti</Text>
          <Text style={styles.subtitle}>
            Esta información nos ayudará a personalizar las recomendaciones para
            tu próximo gran evento.
          </Text>
        </MotiView>

        {/* Nombre */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 250 }}
          style={styles.field}
        >
          <Text style={styles.label}>Nombre Completo</Text>
          <AppInput
            leftIcon="person-outline"
            placeholder="Ej. Ximena González"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </MotiView>

        {/* Ciudad */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 350 }}
          style={styles.field}
        >
          <Text style={styles.label}>Ciudad preferida para el evento</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.textMuted}
              style={styles.pickerIcon}
            />
            <Text
              style={[styles.pickerText, !city && styles.pickerPlaceholder]}
            >
              {city || "Selecciona una ciudad"}
            </Text>
            <Ionicons
              name={showPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          {showPicker && (
            <MotiView
              from={{ opacity: 0, scaleY: 0.9 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ type: "timing", duration: 200 }}
              style={styles.pickerDropdown}
            >
              <Picker
                selectedValue={city}
                onValueChange={(value) => {
                  setCity(value);
                  setShowPicker(false);
                }}
              >
                <Picker.Item
                  label="Selecciona una ciudad"
                  value=""
                  color={colors.textMuted}
                />
                {MEXICO_STATES.map((state) => (
                  <Picker.Item key={state} label={state} value={state} />
                ))}
              </Picker>
            </MotiView>
          )}
        </MotiView>

        {/* Rango de invitados */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 450 }}
          style={styles.field}
        >
          <Text style={styles.label}>Rango esperado de invitados</Text>
          <View style={styles.rangeGrid}>
            <View style={styles.rangeRow}>
              {GUEST_RANGES.slice(0, 2).map((range) => (
                <GuestRangeCard
                  key={range.value}
                  label={range.label}
                  sublabel={range.sublabel}
                  selected={guestRange === range.value}
                  onPress={() => setGuestRange(range.value)}
                />
              ))}
            </View>
            <View style={styles.rangeRow}>
              {GUEST_RANGES.slice(2, 4).map((range) => (
                <GuestRangeCard
                  key={range.value}
                  label={range.label}
                  sublabel={range.sublabel}
                  selected={guestRange === range.value}
                  onPress={() => setGuestRange(range.value)}
                />
              ))}
            </View>
          </View>
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
          Paso 2 de 4: Información Personal
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
  pickerIcon: { marginRight: 8 },
  pickerText: { flex: 1, fontSize: 14, color: colors.textMain },
  pickerPlaceholder: { color: colors.textMuted },
  pickerDropdown: {
    marginTop: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadow.soft,
  },
  rangeGrid: {
    gap: 12,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 12,
  },
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




