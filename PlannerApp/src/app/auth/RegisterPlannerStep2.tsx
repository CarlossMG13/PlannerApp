import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CheckboxRow } from "@/components/ui/CheckboxRow";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { RootStackParamList } from "@/navigation/types";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "RegisterPlannerStep2"
  >;
};

const IDENTITY_OPTIONS = [
  { label: "Empresa", value: "COMPANY" },
  { label: "Independiente", value: "INDEPENDENT" },
];

const EVENT_SPECIALTIES = [
  { value: "WEDDING", icon: "heart-outline" as const, label: "Bodas" },
  {
    value: "CORPORATE",
    icon: "briefcase-outline" as const,
    label: "Corporativos",
  },
  { value: "SOCIAL", icon: "people-outline" as const, label: "Sociales" },
];

export function RegisterPlannerStep2({ navigation }: Props) {
  const [identityType, setIdentityType] = useState("COMPANY");
  const [businessName, setBusinessName] = useState("");
  const [experience, setExperience] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const { mergeDraft } = useOnboardingDraft();

  const toggleSpecialty = (value: string) => {
    setSpecialties((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const nameLabel =
    identityType === "COMPANY" ? "Nombre de la Empresa" : "Nombre Completo";
  const namePlaceholder =
    identityType === "COMPANY"
      ? "Ej: Eventos Brillantes S.A."
      : "Ej: Ana García";

  const canContinue =
    businessName.trim().length > 0 &&
    experience.trim().length > 0 &&
    specialties.length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    mergeDraft({ identityType, businessName, experience: parseInt(experience), specialties });
    navigation.navigate("RegisterPlannerStep3");
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
          <Text style={styles.title}>Configura tu perfil{"\n"}de Planner</Text>
          <Text style={styles.subtitle}>
            Define tu identidad profesional para que los clientes te reconozcan
            fácilmente.
          </Text>
        </MotiView>

        {/* Tipo de identidad */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 250 }}
          style={styles.field}
        >
          <Text style={styles.label}>Tipo de identidad</Text>
          <SegmentedControl
            options={IDENTITY_OPTIONS}
            value={identityType}
            onChange={setIdentityType}
          />
        </MotiView>

        {/* Nombre */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 330 }}
          style={styles.field}
        >
          <Text style={styles.label}>{nameLabel}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name={
                identityType === "COMPANY"
                  ? "business-outline"
                  : "person-outline"
              }
              size={18}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder={namePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>
        </MotiView>

        {/* Años de experiencia */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 410 }}
          style={styles.field}
        >
          <Text style={styles.label}>Años de experiencia</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Ej: 5"
              placeholderTextColor={colors.textMuted}
              value={experience}
              onChangeText={(v) => setExperience(v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
            />
            <Text style={styles.inputSuffix}>años</Text>
          </View>
        </MotiView>

        {/* Especialidades */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 490 }}
          style={styles.field}
        >
          <Text style={styles.label}>Tipos de eventos que gestionas</Text>
          <View style={styles.checkboxList}>
            {EVENT_SPECIALTIES.map((item) => (
              <CheckboxRow
                key={item.value}
                icon={item.icon}
                label={item.label}
                checked={specialties.includes(item.value)}
                onPress={() => toggleSpecialty(item.value)}
              />
            ))}
          </View>
        </MotiView>
      </ScrollView>

      {/* Bottom */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 580 }}
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
        <Text style={styles.hint}>
          Podrás editar esta información más tarde en la configuración de tu
          perfil.
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
  inputSuffix: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },
  checkboxList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 4,
    ...shadow.soft,
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: colors.background,
    ...shadow.soft,
  },
  hint: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});




