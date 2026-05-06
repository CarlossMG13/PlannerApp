import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { colors, radius, shadow } from "@/constants/theme";
import { centeredAuth } from "@/utils/responsive";
import { RootStackParamList } from "@/navigation/types";
import { MotiView } from "moti";

// TODO post-MVP: rehabilitar OAuth (Google / Apple) con useOAuth de @clerk/clerk-expo

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export function LoginScreen({ navigation }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      await setActive({ session: result.createdSessionId });
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.errors?.[0]?.message ?? "No se pudo iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
        style={styles.logoSection}
      >
        <View style={styles.logoBox}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>
        <Text style={styles.appName}>EventPlan</Text>
        <Text style={styles.appSubtitle}>Elite Planning Suite</Text>
      </MotiView>

      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 100 }}
        style={styles.header}
      >
        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitle}>
          Ingresa tus credenciales para continuar
        </Text>
      </MotiView>

      {/* Form */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 200 }}
        style={styles.form}
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <AppInput
            leftIcon="mail-outline"
            placeholder="ejemplo@eventplan.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <AppInput
            leftIcon="lock-closed-outline"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <AppButton
          label="Entrar"
          onPress={handleEmailLogin}
          loading={loading}
          style={styles.loginButton}
        />
      </MotiView>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Register */}
      <View style={styles.registerRow}>
        <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    ...centeredAuth,
  },
  logoSection: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...shadow.primary,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  header: { alignItems: "center", marginBottom: 28, width: "100%" },
  title: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  form: { width: "100%", gap: 16 },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  forgotPassword: { alignSelf: "flex-end" },
  forgotText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  loginButton: { marginTop: 4 },
  spacer: { flex: 1, minHeight: 32 },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  registerText: { fontSize: 14, color: colors.textMuted },
  registerLink: { fontSize: 14, fontWeight: "700", color: colors.primary },
});
