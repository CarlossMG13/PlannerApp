import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  checked: boolean;
  onPress: () => void;
};

export function CheckboxRow({ icon, label, checked, onPress }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Ionicons
        name={icon}
        size={20}
        color={checked ? colors.primary : colors.textMuted}
        style={styles.icon}
      />
      <Text style={[styles.label, checked && styles.labelChecked]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  icon: { marginRight: 10 },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textMain,
  },
  labelChecked: {
    color: colors.primary,
    fontWeight: "600",
  },
});
