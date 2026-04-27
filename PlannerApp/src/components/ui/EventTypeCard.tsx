import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/constants/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function EventTypeCard({
  icon,
  title,
  description,
  selected,
  disabled = false,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      onPress={disabled ? undefined : onPress}
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
    >
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        <Ionicons
          name={icon}
          size={24}
          color={
            disabled ? colors.border : selected ? colors.primary : "#6b7280"
          }
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, disabled && styles.titleDisabled]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.right}>
        {disabled ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Próximo</Text>
          </View>
        ) : (
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={selected ? colors.primary : colors.border}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  cardDisabled: {
    opacity: 0.45,
    backgroundColor: "#fafafa",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconBoxSelected: {
    backgroundColor: "#dcfce7",
  },
  content: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 2,
  },
  titleDisabled: {
    color: colors.textMuted,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
  },
  right: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
