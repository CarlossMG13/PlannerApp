import React, { useState, useEffect, useRef } from "react";
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "@/constants/theme";
import { AssistantChat } from "./AssistantChat";

type Props = {
  eventId?: string;
};

export function AssistantHeaderButton({ eventId }: Props) {
  const [visible, setVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]);
    const loop = Animated.loop(pulse, { iterations: 3 });
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Abrir asistente Plania"
        >
          <Ionicons name="sparkles" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <AssistantChat
        visible={visible}
        onClose={() => setVisible(false)}
        eventId={eventId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },
});
