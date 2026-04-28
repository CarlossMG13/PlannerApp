import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "@/app/auth/LoginScreen";
import { RegisterScreen } from "@/app/auth/RegisterScreen";
import { RootStackParamList } from "./types";
import { OnboardingProvider } from "@/hooks/useOnboardingDraft";
import { colors } from "@/constants/theme";

// Screens Register Client
import { RegisterClientStep2 } from "@/app/auth/RegisterClientStep2";
import { RegisterClientStep3 } from "@/app/auth/RegisterClientStep3";
import { RegisterClientStep4 } from "@/app/auth/RegisterClientStep4";

// Screens Register Planner
import { RegisterPlannerStep2 } from "@/app/auth/RegisterPlannerStep2";
import { RegisterPlannerStep3 } from "@/app/auth/RegisterPlannerStep3";
import { RegisterPlannerStep4 } from "@/app/auth/RegisterPlannerStep4";

// Screens Register Vendor
import { RegisterVendorStep2 } from "@/app/auth/RegisterVendorStep2";
import { RegisterVendorStep3 } from "@/app/auth/RegisterVendorStep3";

// Email Verification Screen
import { EmailVerification } from "@/app/auth/EmailVerification";

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO: reemplazar con navegación de tabs una vez que existan las pantallas principales
function MainPlaceholder() {
  return (
    <View style={placeholder.container}>
      <Text style={placeholder.text}>¡Registro completado!</Text>
      <Text style={placeholder.sub}>Pantalla principal próximamente</Text>
    </View>
  );
}

const placeholder = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: { fontSize: 22, fontWeight: "800", color: colors.textMain },
  sub: { fontSize: 14, color: colors.textMuted },
});

export function RootNavigator() {
  return (
    <NavigationContainer>
      <OnboardingProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* Client flow */}
          <Stack.Screen name="RegisterClientStep2" component={RegisterClientStep2} />
          <Stack.Screen name="RegisterClientStep3" component={RegisterClientStep3} />
          <Stack.Screen name="RegisterClientStep4" component={RegisterClientStep4} />

          {/* Planner flow */}
          <Stack.Screen name="RegisterPlannerStep2" component={RegisterPlannerStep2} />
          <Stack.Screen name="RegisterPlannerStep3" component={RegisterPlannerStep3} />
          <Stack.Screen name="RegisterPlannerStep4" component={RegisterPlannerStep4} />

          {/* Vendor flow */}
          <Stack.Screen name="RegisterVendorStep2" component={RegisterVendorStep2} />
          <Stack.Screen name="RegisterVendorStep3" component={RegisterVendorStep3} />

          {/* Common */}
          <Stack.Screen name="EmailVerification" component={EmailVerification} />
          <Stack.Screen name="Main" component={MainPlaceholder} />
        </Stack.Navigator>
      </OnboardingProvider>
    </NavigationContainer>
  );
}
