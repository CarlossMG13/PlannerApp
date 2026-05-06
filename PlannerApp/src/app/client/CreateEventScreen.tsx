import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";

import { colors, radius } from "@/constants/theme";
import { centered } from "@/utils/responsive";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { EventTypeCard } from "@/components/ui/EventTypeCard";
import { GuestRangeCard } from "@/components/ui/GuestRangeCard";
import { StepProgress } from "@/components/ui/StepProgress";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const TOTAL_STEPS = 4;

type EventType = "WEDDING" | "CORPORATE" | "BIRTHDAY" | "SOCIAL" | "OTHER";

const EVENT_TYPES: Array<{
  type: EventType;
  icon: "heart" | "briefcase" | "gift" | "people" | "sparkles";
  title: string;
  description: string;
}> = [
  { type: "WEDDING", icon: "heart", title: "Boda", description: "Ceremonias y recepciones" },
  { type: "CORPORATE", icon: "briefcase", title: "Corporativo", description: "Conferencias, talleres, convenciones" },
  { type: "BIRTHDAY", icon: "gift", title: "Cumpleaños", description: "Fiestas y celebraciones" },
  { type: "SOCIAL", icon: "people", title: "Social", description: "Reuniones y festividades" },
  { type: "OTHER", icon: "sparkles", title: "Otro", description: "Otro tipo de evento" },
];

const GUEST_RANGES = [
  { label: "1–50", sublabel: "Íntimo", value: 50 },
  { label: "51–100", sublabel: "Pequeño", value: 100 },
  { label: "101–200", sublabel: "Mediano", value: 200 },
  { label: "201–500", sublabel: "Grande", value: 500 },
  { label: "500+", sublabel: "Masivo", value: 1000 },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function buildYears(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear + i);
}

function buildDays(month: number, year: number): number[] {
  const count = new Date(year, month, 0).getDate();
  return Array.from({ length: count }, (_, i) => i + 1);
}

// ─── Date Picker Component ────────────────────────────

type DatePickerProps = {
  day: number;
  month: number;
  year: number;
  onDayChange: (d: number) => void;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
};

function ChipScroll({
  items,
  selected,
  onSelect,
}: {
  items: Array<{ value: number; label: string }>;
  selected: number;
  onSelect: (v: number) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
      {items.map(({ value, label }) => (
        <TouchableOpacity
          key={value}
          onPress={() => onSelect(value)}
          style={[styles.pickerChip, selected === value && styles.pickerChipActive]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: selected === value }}
        >
          <Text style={[styles.pickerChipText, selected === value && styles.pickerChipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function DatePicker({ day, month, year, onDayChange, onMonthChange, onYearChange }: DatePickerProps) {
  const dayItems = buildDays(month, year).map((d) => ({ value: d, label: String(d) }));
  const monthItems = MONTHS.map((name, i) => ({ value: i + 1, label: name }));
  const yearItems = buildYears().map((y) => ({ value: y, label: String(y) }));

  return (
    <View style={styles.datePickerContainer}>
      <Text style={styles.datePickerLabel}>Día</Text>
      <ChipScroll items={dayItems} selected={day} onSelect={onDayChange} />
      <Text style={styles.datePickerLabel}>Mes</Text>
      <ChipScroll items={monthItems} selected={month} onSelect={onMonthChange} />
      <Text style={styles.datePickerLabel}>Año</Text>
      <ChipScroll items={yearItems} selected={year} onSelect={onYearChange} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────

export function CreateEventScreen() {
  const navigation = useNavigation();
  const { getToken } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Tipo
  const [eventType, setEventType] = useState<EventType | null>(null);

  // Step 2 — Detalles básicos
  const [title, setTitle] = useState("");
  const today = new Date();
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear() + 1);

  // Step 3 — Lugar y aforo
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [guestCount, setGuestCount] = useState<number | null>(null);

  // Step 4 — Presupuesto
  const [totalBudget, setTotalBudget] = useState("");

  const canNext = () => {
    if (step === 1) return eventType !== null;
    if (step === 2) return title.trim().length >= 2;
    if (step === 3) return true; // venue/guests are optional
    if (step === 4) return true;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!eventType) return;
    setLoading(true);
    try {
      const token = await getToken();
      const eventDate = new Date(year, month - 1, day).toISOString();

      const res = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          type: eventType,
          eventDate,
          venueName: venueName.trim() || null,
          venueAddress: venueAddress.trim() || null,
          guestCount: guestCount ?? null,
          totalBudget: totalBudget ? parseFloat(totalBudget.replace(/,/g, "")) : null,
          currency: "MXN",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert("Error", data.error ?? "No se pudo crear el evento");
        return;
      }

      navigation.goBack();
    } catch {
      Alert.alert("Error", "No se pudo crear el evento. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Regresar">
            <Ionicons name="chevron-back" size={22} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo evento</Text>
          <View style={{ width: 40 }} />
        </View>

        <StepProgress steps={TOTAL_STEPS} current={step} />

        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <MotiView
              key={step}
              from={{ opacity: 0, translateX: 24 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 260 }}
            >
              {step === 1 && <StepType selected={eventType} onSelect={setEventType} />}
              {step === 2 && (
                <StepDetails
                  title={title} onTitleChange={setTitle}
                  day={day} month={month} year={year}
                  onDayChange={setDay} onMonthChange={setMonth} onYearChange={setYear}
                  formattedDate={formattedDate}
                />
              )}
              {step === 3 && (
                <StepVenue
                  venueName={venueName} onVenueNameChange={setVenueName}
                  venueAddress={venueAddress} onVenueAddressChange={setVenueAddress}
                  guestCount={guestCount} onGuestCountChange={setGuestCount}
                />
              )}
              {step === 4 && (
                <StepBudget budget={totalBudget} onBudgetChange={setTotalBudget} />
              )}
            </MotiView>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <AppButton
            label={step < TOTAL_STEPS ? "Siguiente" : "Crear evento"}
            onPress={handleNext}
            loading={loading}
            style={!canNext() ? styles.btnDisabled : undefined}
          />
          {step < TOTAL_STEPS && (
            <TouchableOpacity onPress={() => setStep(step + 1)} style={styles.skipBtn} accessibilityRole="button">
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step 1: Tipo ─────────────────────────────────────

function StepType({ selected, onSelect }: { selected: EventType | null; onSelect: (t: EventType) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Qué tipo de evento estás planeando?</Text>
      <Text style={styles.stepSubtitle}>Elige la categoría que mejor describa tu evento</Text>
      <View style={styles.typeList}>
        {EVENT_TYPES.map((et) => (
          <EventTypeCard
            key={et.type}
            icon={et.icon}
            title={et.title}
            description={et.description}
            selected={selected === et.type}
            onPress={() => onSelect(et.type)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Step 2: Detalles ─────────────────────────────────

type StepDetailsProps = {
  title: string; onTitleChange: (v: string) => void;
  day: number; month: number; year: number;
  onDayChange: (v: number) => void;
  onMonthChange: (v: number) => void;
  onYearChange: (v: number) => void;
  formattedDate: string;
};

function StepDetails({ title, onTitleChange, day, month, year, onDayChange, onMonthChange, onYearChange, formattedDate }: StepDetailsProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cuéntanos sobre tu evento</Text>
      <Text style={styles.stepSubtitle}>Dale un nombre y elige la fecha</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nombre del evento *</Text>
        <AppInput
          leftIcon="pencil-outline"
          placeholder="Ej. Boda de Ana y Carlos"
          value={title}
          onChangeText={onTitleChange}
          autoCapitalize="words"
          maxLength={80}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Fecha del evento *</Text>
        <View style={styles.dateSummary}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.dateSummaryText}>{formattedDate}</Text>
        </View>
        <DatePicker
          day={day} month={month} year={year}
          onDayChange={onDayChange}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
      </View>
    </View>
  );
}

// ─── Step 3: Lugar y aforo ────────────────────────────

type StepVenueProps = {
  venueName: string; onVenueNameChange: (v: string) => void;
  venueAddress: string; onVenueAddressChange: (v: string) => void;
  guestCount: number | null; onGuestCountChange: (v: number | null) => void;
};

function StepVenue({ venueName, onVenueNameChange, venueAddress, onVenueAddressChange, guestCount, onGuestCountChange }: StepVenueProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Dónde y para cuántos?</Text>
      <Text style={styles.stepSubtitle}>Puedes completar esto más adelante</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nombre del lugar</Text>
        <AppInput
          leftIcon="location-outline"
          placeholder="Ej. Hacienda San Ángel"
          value={venueName}
          onChangeText={onVenueNameChange}
          autoCapitalize="words"
          maxLength={100}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Dirección</Text>
        <AppInput
          leftIcon="map-outline"
          placeholder="Ej. Pedregal 24, Ciudad de México"
          value={venueAddress}
          onChangeText={onVenueAddressChange}
          autoCapitalize="words"
          maxLength={200}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Número aproximado de invitados</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestGrid}>
          {GUEST_RANGES.map((r) => (
            <View key={r.value} style={styles.guestCell}>
              <GuestRangeCard
                label={r.label}
                sublabel={r.sublabel}
                selected={guestCount === r.value}
                onPress={() => onGuestCountChange(guestCount === r.value ? null : r.value)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Step 4: Presupuesto ──────────────────────────────

function StepBudget({ budget, onBudgetChange }: { budget: string; onBudgetChange: (v: string) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Cuál es tu presupuesto?</Text>
      <Text style={styles.stepSubtitle}>Ingresa el monto total en MXN (puedes ajustarlo después)</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Presupuesto total (MXN)</Text>
        <AppInput
          leftIcon="wallet-outline"
          placeholder="Ej. 150000"
          value={budget}
          onChangeText={onBudgetChange}
          keyboardType="numeric"
          maxLength={12}
        />
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.tipText}>
          Podrás desglosar el presupuesto por categorías una vez que el evento esté creado.
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24, ...centered },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  skipBtn: { alignItems: "center", paddingVertical: 6 },
  skipText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },

  stepContainer: { paddingTop: 8, gap: 20 },
  stepTitle: { fontSize: 22, fontWeight: "800", color: colors.textMain, lineHeight: 30 },
  stepSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: -12 },

  typeList: { gap: 10 },

  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.textMain },

  dateSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: "flex-start",
  },
  dateSummaryText: { fontSize: 14, fontWeight: "700", color: colors.primary },

  datePickerContainer: { gap: 6 },
  datePickerLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  pickerRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  pickerChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickerChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  pickerChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  pickerChipTextActive: { color: colors.primary },

  guestGrid: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  guestCell: { width: 100 },

  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary + "40",
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textMain, lineHeight: 20 },
});
