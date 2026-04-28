import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "@/components/ui/AppButton";
import { StepProgress } from "@/components/ui/StepProgress";
import { EventTypeCard } from "@/components/ui/EventTypeCard";
import { colors, shadow } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "RegisterClientStep3"
  >;
};

const EVENT_TYPES = [
  {
    value: "WEDDING",
    icon: "heart" as const,
    title: "Bodas",
    description: "Ceremonias, banquetes y fiestas",
    disabled: false,
  },
  {
    value: "BIRTHDAY",
    icon: "gift-outline" as const,
    title: "Cumpleaños",
    description: "Fiestas infantiles y de adultos",
    disabled: true,
  },
  {
    value: "CORPORATE",
    icon: "business-outline" as const,
    title: "Corporativos",
    description: "Conferencias, networking y cenas",
    disabled: true,
  },
  {
    value: "SOCIAL",
    icon: "sparkles-outline" as const,
    title: "Galas Sociales",
    description: "Eventos benéficos y alfombras rojas",
    disabled: true,
  },
];

export function RegisterClientStep3({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>(["WEDDING"]);
  const { mergeDraft } = useOnboardingDraft();

  const toggleType = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const canContinue = selected.length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    mergeDraft({ eventTypes: selected });
    navigation.navigate("RegisterClientStep4");
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
        <StepProgress steps={4} current={3} />
      </MotiView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <MotiView
          from={{ opacity: 0, translateX: -16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 450, delay: 150 }}
          style={styles.headline}
        >
          <Text style={styles.title}>
            ¿Qué tipo de eventos{"\n"}te interesan?
          </Text>
          <Text style={styles.subtitle}>
            Selecciona todas las opciones que encajen con lo que buscas.
          </Text>
        </MotiView>

        {/* Banner informativo */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          style={styles.infoBanner}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#92400e"
          />
          <Text style={styles.infoText}>
            En esta versión inicial solo está disponible la categoría de Bodas.
            Más categorías próximamente.
          </Text>
        </MotiView>

        {/* Cards */}
        <View style={styles.cards}>
          {EVENT_TYPES.map((type, index) => (
            <MotiView
              key={type.value}
              from={{ opacity: 0, translateX: 40 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: "spring",
                delay: 280 + index * 90,
                damping: 18,
                stiffness: 120,
              }}
            >
              <EventTypeCard
                icon={type.icon}
                title={type.title}
                description={type.description}
                selected={selected.includes(type.value)}
                disabled={type.disabled}
                onPress={() => toggleType(type.value)}
              />
            </MotiView>
          ))}
        </View>
      </ScrollView>

      {/* Bottom */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 600 }}
        style={styles.bottom}
      >
        <View style={styles.buttonRow}>
          <AppButton
            label="Anterior"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <AppButton
            label="Continuar"
            onPress={handleContinue}
            style={[styles.continueButton, { opacity: canContinue ? 1 : 0.5 }] as any}
            rightElement={
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            }
          />
        </View>
        <Text style={styles.stepIndicator}>
          Paso 3 de 4: Preferencias de Evento
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
  headline: { marginTop: 8, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },
  cards: { gap: 12 },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: colors.background,
    ...shadow.soft,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  stepIndicator: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
  },
});
