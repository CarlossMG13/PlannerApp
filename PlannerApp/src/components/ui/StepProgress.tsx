import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

type Props = {
  steps: number;
  current: number; // 1-based
};

export function StepProgress({ steps, current }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          style={[styles.bar, i < current ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  bar: {
    height: 6,
    width: 44,
    borderRadius: 99,
  },
  active: {
    backgroundColor: colors.primary,
  },
  inactive: {
    backgroundColor: colors.border,
  },
});
