import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from "react-native";
import { colors, radius, shadow } from "@/constants/theme";

type Variant = "primary" | "outline";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  leftElement?: React.ReactNode;
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  leftElement,
  style,
}: Props) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        isPrimary ? shadow.primary : shadow.soft,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : colors.textMain} />
      ) : (
        <View style={styles.inner}>
          {leftElement}
          <Text
            style={[
              styles.label,
              isPrimary ? styles.labelPrimary : styles.labelOutline,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  labelOutline: {
    color: colors.textMain,
  },
});
