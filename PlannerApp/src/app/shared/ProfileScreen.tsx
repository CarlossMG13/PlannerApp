import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from "@/store/userStore";
import { colors, radius, shadow } from "@/constants/theme";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Cliente",
  PLANNER: "Planner",
  VENDOR: "Proveedor",
  ADMIN: "Admin",
};

const ROLE_COLOR: Record<string, string> = {
  CLIENT: colors.primary,
  PLANNER: "#7c3aed",
  VENDOR: "#ea580c",
  ADMIN: "#0369a1",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Accordion item ────────────────────────────────────────────────────────────
function AccordionSection({
  icon,
  title,
  delay,
  children,
}: {
  icon: any;
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 350, delay: delay ?? 0 }}
      style={styles.accordion}
    >
      <TouchableOpacity
        style={styles.accordionHeader}
        activeOpacity={0.7}
        onPress={() => setOpen((v) => !v)}
      >
        <View style={styles.accordionIconBox}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {open && <View style={styles.accordionBody}>{children}</View>}
    </MotiView>
  );
}

// ─── Info row inside accordion ─────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string | null | undefined;
  isLast?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { signOut } = useAuth();
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            clearUser();
            await signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!user) return null;

  const roleColor = ROLE_COLOR[user.role] ?? colors.primary;
  const cp = user.clientProfile as Record<string, any> | null;
  const pp = user.plannerProfile as Record<string, any> | null;
  const vp = user.vendorProfile as Record<string, any> | null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Avatar + name */}
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 140 }}
          style={styles.heroCard}
        >
          <View style={[styles.avatar, { borderColor: roleColor }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {initials(user.name)}
            </Text>
          </View>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>
              {ROLE_LABEL[user.role]}
            </Text>
          </View>
        </MotiView>

        {/* Acordiones */}
        <AccordionSection icon="person-circle-outline" title="Información personal" delay={100}>
          <InfoRow label="Nombre completo" value={user.name} />
          <InfoRow label="Correo electrónico" value={user.email} isLast />
        </AccordionSection>

        {/* CLIENT — datos fiscales */}
        {user.role === "CLIENT" && cp && (cp.rfc || cp.razonSocial) && (
          <AccordionSection icon="document-text-outline" title="Datos de facturación" delay={160}>
            <InfoRow label="RFC" value={cp.rfc} />
            <InfoRow label="Razón Social" value={cp.razonSocial} />
            <InfoRow label="Régimen Fiscal" value={cp.regimenFiscal} isLast />
          </AccordionSection>
        )}

        {/* CLIENT — preferencias de evento */}
        {user.role === "CLIENT" && cp && (cp.eventType || cp.guestRange || cp.state) && (
          <AccordionSection icon="calendar-outline" title="Preferencias de evento" delay={200}>
            <InfoRow label="Tipo de evento" value={cp.eventType} />
            <InfoRow label="Invitados estimados" value={cp.guestRange} />
            <InfoRow label="Estado" value={cp.state} />
            <InfoRow label="Presupuesto" value={cp.budgetRange} isLast />
          </AccordionSection>
        )}

        {/* PLANNER — perfil profesional */}
        {user.role === "PLANNER" && pp && (
          <AccordionSection icon="briefcase-outline" title="Perfil profesional" delay={160}>
            <InfoRow label="Tipo" value={pp.identityType === "COMPANY" ? "Empresa" : "Independiente"} />
            <InfoRow label="Especialidades" value={Array.isArray(pp.specialties) ? pp.specialties.join(", ") : pp.specialties} />
            <InfoRow label="Años de experiencia" value={pp.yearsOfExperience != null ? String(pp.yearsOfExperience) : undefined} />
            <InfoRow label="Bio" value={pp.bio} isLast />
          </AccordionSection>
        )}

        {/* VENDOR — perfil de proveedor */}
        {user.role === "VENDOR" && vp && (
          <AccordionSection icon="storefront-outline" title="Perfil de proveedor" delay={160}>
            <InfoRow label="Categoría" value={vp.category} />
            <InfoRow label="Descripción" value={vp.description} isLast />
          </AccordionSection>
        )}

        <AccordionSection icon="shield-checkmark-outline" title="Seguridad" delay={240}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contraseña</Text>
            <Text style={[styles.infoValue, { color: colors.textMuted }]}>••••••••</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Autenticación 2FA</Text>
            <Text style={[styles.infoValue, { color: "#22c55e", fontWeight: "700" }]}>
              Activa
            </Text>
          </View>
        </AccordionSection>

        {/* Logout */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350, delay: 320 }}
        >
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </MotiView>

        <Text style={styles.version}>Plania v1.0.0 · MVP ExpoSciencia 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16, gap: 12 },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    ...shadow.soft,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    marginBottom: 4,
  },
  avatarText: { fontSize: 26, fontWeight: "800" },
  heroName: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  heroEmail: { fontSize: 13, color: colors.textMuted },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: "700" },

  // Accordion
  accordion: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  accordionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  accordionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: colors.textMain,
    fontWeight: "600",
    textAlign: "right",
    flex: 2,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fef2f2",
    borderRadius: radius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },

  version: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
