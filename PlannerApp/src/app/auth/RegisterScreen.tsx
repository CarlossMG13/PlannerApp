import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { RoleCard } from "@/components/ui/RoleCard";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { colors, shadow } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { RootStackParamList } from "@/navigation/types";
import { useOnboardingDraft, OnboardingRole } from "@/hooks/useOnboardingDraft";

type Role = OnboardingRole;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

const CARDS = [
  {
    role: "CLIENT" as Role,
    icon: "person-outline" as const,
    iconColor: colors.primary,
    iconBg: "#f0fdf4",
    title: "Cliente",
    description: "Estoy planeando mi propio evento.",
  },
  {
    role: "PLANNER" as Role,
    icon: "calendar-outline" as const,
    iconColor: colors.primary,
    iconBg: "#f0fdf4",
    title: "Planner",
    description: "Gestiono eventos para terceros.",
  },
  {
    role: "VENDOR" as Role,
    icon: "storefront-outline" as const,
    iconColor: "#ea580c",
    iconBg: "#fff7ed",
    title: "Proveedor",
    description: "Ofrezco servicios y productos.",
  },
];

export function RegisterScreen({ navigation }: Props) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { setRole } = useOnboardingDraft();

  const handleContinue = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    if (selectedRole === "CLIENT") navigation.navigate("RegisterClientStep2");
    if (selectedRole === "PLANNER") navigation.navigate("RegisterPlannerStep2");
    if (selectedRole === "VENDOR") navigation.navigate("RegisterVendorStep2");
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
        <Text style={styles.headerTitle}>Registro de Usuario</Text>
        <View style={styles.headerSpacer} />
      </MotiView>

      {/* Progress */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 400, delay: 100 }}
      >
        <StepProgress steps={4} current={1} />
      </MotiView>

      {/* Content */}
      <View style={styles.content}>
        {/* Headline */}
        <MotiView
          from={{ opacity: 0, translateX: -16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 450, delay: 150 }}
          style={styles.headline}
        >
          <Text style={styles.title}>
            ¡Bienvenido!{"\n"}¿Cuál es tu perfil?
          </Text>
          <Text style={styles.subtitle}>
            Selecciona el rol que mejor te describa para personalizar tu
            experiencia en la plataforma.
          </Text>
        </MotiView>

        {/* Cards con entrada escalonada */}
        <View style={styles.cards}>
          {CARDS.map((card, index) => (
            <MotiView
              key={card.role}
              from={{ opacity: 0, translateX: 40 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: "spring",
                delay: 250 + index * 100,
                damping: 18,
                stiffness: 120,
              }}
            >
              <RoleCard
                icon={card.icon}
                iconColor={card.iconColor}
                iconBg={card.iconBg}
                title={card.title}
                description={card.description}
                selected={selectedRole === card.role}
                onPress={() => setSelectedRole(card.role)}
              />
            </MotiView>
          ))}
        </View>
      </View>

      {/* Bottom */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 600 }}
        style={styles.bottom}
      >
        <AppButton
          label="Continuar"
          onPress={handleContinue}
          style={{ opacity: selectedRole ? 1 : 0.5 }}
          rightElement={
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          }
        />
        <Text style={styles.terms}>
          Al continuar, aceptas nuestros términos de servicio y política de
          privacidad.
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
  content: { flex: 1, paddingHorizontal: 20, ...centered },
  headline: { marginTop: 8, marginBottom: 28 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  cards: { gap: 12 },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: colors.background,
    ...shadow.soft,
  },
  terms: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 24,
  },
});
