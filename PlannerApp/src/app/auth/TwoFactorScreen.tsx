import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSignIn } from "@clerk/clerk-expo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "@/components/ui/AppButton";
import { colors, radius, shadow } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TwoFactor">;
};

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export function TwoFactorScreen({ navigation }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect second factor strategy from the in-progress signIn object
  const secondFactors = signIn?.supportedSecondFactors ?? [];
  const totpFactor = secondFactors.find((f) => f.strategy === "totp");
  const emailFactor = secondFactors.find((f) => f.strategy === "email_code") as
    | { strategy: "email_code"; emailAddressId: string }
    | undefined;
  const phoneFactor = secondFactors.find((f) => f.strategy === "phone_code") as
    | { strategy: "phone_code"; phoneNumberId: string }
    | undefined;

  const strategy: string = totpFactor
    ? "totp"
    : emailFactor
    ? "email_code"
    : phoneFactor
    ? "phone_code"
    : "totp";

  const isEmailOrPhone = strategy === "email_code" || strategy === "phone_code";

  // Prepare email/phone factor on mount so a code is sent
  useEffect(() => {
    if (!isLoaded || !signIn) return;
    if (strategy === "email_code" && emailFactor) {
      signIn
        .prepareSecondFactor({ strategy: "email_code", emailAddressId: emailFactor.emailAddressId })
        .then(() => startCooldown())
        .catch(() => {});
    } else if (strategy === "phone_code" && phoneFactor) {
      signIn
        .prepareSecondFactor({ strategy: "phone_code", phoneNumberId: phoneFactor.phoneNumberId })
        .then(() => startCooldown())
        .catch(() => {});
    }
  }, [isLoaded]);

  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const fullCode = code.join("");
  const isComplete = fullCode.length === CODE_LENGTH && code.every((d) => d !== "");

  const handleDigit = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === CODE_LENGTH - 1) {
      Keyboard.dismiss();
      verifyCode(next.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = "";
      setCode(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeStr: string) => {
    if (!signIn || codeStr.length !== CODE_LENGTH) return;
    setVerifying(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: strategy as any,
        code: codeStr,
      });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
      } else {
        Alert.alert("Error", `Estado inesperado: ${result.status}`);
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Código incorrecto";
      Alert.alert("Código inválido", msg);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !signIn) return;
    setResending(true);
    try {
      if (strategy === "email_code" && emailFactor) {
        await signIn.prepareSecondFactor({ strategy: "email_code", emailAddressId: emailFactor.emailAddressId });
      } else if (strategy === "phone_code" && phoneFactor) {
        await signIn.prepareSecondFactor({ strategy: "phone_code", phoneNumberId: phoneFactor.phoneNumberId });
      }
      startCooldown();
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "No se pudo reenviar");
    } finally {
      setResending(false);
    }
  };

  const subtitle =
    strategy === "totp"
      ? "Ingresa el código de 6 dígitos de tu aplicación autenticadora (Google Authenticator, Authy, etc.)"
      : strategy === "email_code"
      ? "Ingresa el código de 6 dígitos que enviamos a tu correo electrónico"
      : "Ingresa el código de 6 dígitos que enviamos a tu teléfono";

  const iconName = strategy === "totp" ? "shield-checkmark" : "mail";

  return (
    <SafeAreaView style={styles.safe}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textMain} />
        </TouchableOpacity>

        <MotiView
          from={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 100, damping: 14, stiffness: 130 }}
          style={styles.iconBox}
        >
          <Ionicons name={iconName} size={40} color={colors.primary} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
        >
          <Text style={styles.title}>Verificación en{"\n"}dos pasos</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 320 }}
          style={styles.otpRow}
        >
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              style={[styles.otpCell, digit !== "" && styles.otpCellFilled]}
              value={digit}
              onChangeText={(t) => handleDigit(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </MotiView>

        {verifying && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.verifyingRow}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.verifyingText}>Verificando...</Text>
          </MotiView>
        )}

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 440 }}
          style={styles.buttonWrap}
        >
          <AppButton
            label="Verificar"
            onPress={() => { if (isComplete) verifyCode(fullCode); }}
            loading={verifying}
            style={{ opacity: isComplete && !verifying ? 1 : 0.5 }}
            rightElement={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
          />
        </MotiView>

        {isEmailOrPhone && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 400, delay: 560 }}
            style={styles.resendRow}
          >
            {resendCooldown > 0 ? (
              <Text style={styles.resendCooldown}>
                Reenviar en <Text style={styles.resendTimer}>{resendCooldown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? "Enviando..." : "Reenviar código"}
                </Text>
              </TouchableOpacity>
            )}
          </MotiView>
        )}
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    padding: 8,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    ...shadow.soft,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  otpCell: {
    width: 46,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMain,
    ...shadow.soft,
  },
  otpCellFilled: {
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  verifyingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  verifyingText: { fontSize: 13, color: colors.textMuted },
  buttonWrap: { width: "100%", marginBottom: 20 },
  resendRow: { alignItems: "center" },
  resendCooldown: { fontSize: 13, color: colors.textMuted },
  resendTimer: { fontWeight: "700", color: colors.textMain },
  resendLink: { fontSize: 13, fontWeight: "700", color: colors.primary },
});
