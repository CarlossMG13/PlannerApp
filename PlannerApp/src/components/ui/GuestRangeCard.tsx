import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, radius, shadow } from "@/constants/theme";

type Props = {
  label: string;
  sublabel: string;
  selected: boolean;
  onPress: () => void;
};

export function GuestRangeCard({ label, sublabel, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      <Text style={[styles.sublabel, selected && styles.sublabelSelected]}>
        {sublabel}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f0fdf4",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 2,
  },
  labelSelected: {
    color: colors.primary,
  },
  sublabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sublabelSelected: {
    color: colors.primary,
  },
});
