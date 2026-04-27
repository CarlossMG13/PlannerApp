import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native";
import { colors } from "@/constants/theme";

export function EmailVerification() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.text}>Verificación de correo</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, color: colors.textMain },
});
