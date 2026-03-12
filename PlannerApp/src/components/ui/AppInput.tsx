import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/constants/theme";

type Props = TextInputProps & {
  leftIcon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
};

export function AppInput({
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword,
  ...props
}: Props) {
  const [secureText, setSecureText] = useState(isPassword ?? false);

  return (
    <View style={styles.container}>
      <Ionicons
        name={leftIcon}
        size={18}
        color={colors.textMuted}
        style={styles.leftIcon}
      />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureText}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={() => setSecureText((v) => !v)}
          style={styles.rightIcon}
        >
          <Ionicons
            name={secureText ? "eye-outline" : "eye-off-outline"}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    ...shadow.soft,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textMain,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 2,
  },
});
