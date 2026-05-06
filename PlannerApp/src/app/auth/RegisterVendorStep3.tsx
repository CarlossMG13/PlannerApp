import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { colors, radius, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { RootStackParamList } from "@/navigation/types";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "RegisterVendorStep3"
  >;
};

const REGIMENES = [
  { label: "General de Ley Personas Morales", value: "601" },
  { label: "Sueldos y Salarios", value: "605" },
  { label: "Arrendamiento", value: "606" },
  { label: "Actividades Empresariales y Profesionales", value: "612" },
  { label: "Incorporación Fiscal", value: "621" },
  { label: "RESICO", value: "626" },
];

export function RegisterVendorStep3({ navigation }: Props) {
  const { mergeDraft, submitSignUp } = useOnboardingDraft();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rfc, setRfc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [showRegimen, setShowRegimen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 8;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canSubmit =
    emailValid &&
    passwordValid &&
    passwordsMatch &&
    confirmPassword.length > 0 &&
    termsAccepted;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      mergeDraft({
        rfc: rfc || undefined,
        razonSocial: razonSocial || undefined,
        regimenFiscal: regimenFiscal || undefined,
      });
      await submitSignUp(email, password);
      navigation.navigate("EmailVerification");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.errors?.[0]?.message ?? "No se pudo crear la cuenta",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
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

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 80 }}
      >
        <StepProgress steps={3} current={3} />
      </MotiView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateX: -16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 450, delay: 150 }}
          style={styles.headline}
        >
          <Text style={styles.title}>Seguridad y{"\n"}Facturación</Text>
          <Text style={styles.subtitle}>
            Protege tu cuenta y configura tus datos fiscales si los necesitas.
          </Text>
        </MotiView>

        {/* Credenciales */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 250 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Acceso</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <AppInput
              leftIcon="mail-outline"
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {email.length > 0 && !emailValid && (
              <Text style={styles.errorText}>Ingresa un correo válido</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Crear Contraseña</Text>
            <AppInput
              leftIcon="lock-closed-outline"
              placeholder="Mínimo 8 caracteres"
              isPassword
              value={password}
              onChangeText={setPassword}
            />
            {password.length > 0 && !passwordValid && (
              <Text style={styles.errorText}>
                La contraseña debe tener al menos 8 caracteres
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <AppInput
              leftIcon="lock-closed-outline"
              placeholder="Repite tu contraseña"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
            )}
          </View>
        </MotiView>

        {/* Facturación */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 350 }}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Datos de Facturación</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Opcional</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>RFC / Tax ID</Text>
            <AppInput
              leftIcon="card-outline"
              placeholder="XAXX010101000"
              autoCapitalize="characters"
              value={rfc}
              onChangeText={setRfc}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Razón Social</Text>
            <AppInput
              leftIcon="business-outline"
              placeholder="Nombre legal o empresa"
              value={razonSocial}
              onChangeText={setRazonSocial}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Régimen Fiscal</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRegimen(!showRegimen)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.pickerText,
                  !regimenFiscal && styles.pickerPlaceholder,
                ]}
              >
                {REGIMENES.find((r) => r.value === regimenFiscal)?.label ||
                  "Selecciona una opción"}
              </Text>
              <Ionicons
                name={showRegimen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {showRegimen && (
              <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 200 }}
                style={styles.dropdown}
              >
                {REGIMENES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.dropdownItem,
                      regimenFiscal === r.value && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setRegimenFiscal(r.value);
                      setShowRegimen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        regimenFiscal === r.value && styles.dropdownTextSelected,
                      ]}
                    >
                      {r.label}
                    </Text>
                    {regimenFiscal === r.value && (
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
          </View>
        </MotiView>

        {/* Términos */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400, delay: 450 }}
          style={styles.termsRow}
        >
          <Switch
            value={termsAccepted}
            onValueChange={setTermsAccepted}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
          <Text style={styles.termsText}>
            Acepto los{" "}
            <Text style={styles.termsLink}>Términos y Condiciones</Text> y la{" "}
            <Text style={styles.termsLink}>Política de Privacidad</Text>.
          </Text>
        </MotiView>
      </ScrollView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 550 }}
        style={styles.bottom}
      >
        <AppButton
          label="Finalizar Registro"
          onPress={handleSubmit}
          loading={loading}
          style={{ opacity: canSubmit ? 1 : 0.5 }}
          rightElement={
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
          }
        />
        <Text style={styles.stepIndicator}>
          Paso 3 de 3: Seguridad y Legal
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
  headline: { marginTop: 8, marginBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    gap: 16,
    ...shadow.soft,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: "#f3f4f6",
  },
  optionalText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  errorText: { fontSize: 11, color: "#ef4444", marginLeft: 4, marginTop: 2 },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },
  pickerText: { flex: 1, fontSize: 14, color: colors.textMain },
  pickerPlaceholder: { color: colors.textMuted },
  dropdown: {
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: { backgroundColor: "#f0fdf4" },
  dropdownText: {
    fontSize: 13,
    color: colors.textMain,
    flex: 1,
    marginRight: 8,
  },
  dropdownTextSelected: { color: colors.primary, fontWeight: "600" },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  termsText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: "600" },
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




