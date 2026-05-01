import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";

import { RootStackParamList } from "./types";
import { MainNavigator } from "./MainNavigator";
import { colors } from "@/constants/theme";

import { LoginScreen } from "@/app/auth/LoginScreen";
import { RegisterScreen } from "@/app/auth/RegisterScreen";
import { RegisterClientStep2 } from "@/app/auth/RegisterClientStep2";
import { RegisterClientStep3 } from "@/app/auth/RegisterClientStep3";
import { RegisterClientStep4 } from "@/app/auth/RegisterClientStep4";
import { RegisterPlannerStep2 } from "@/app/auth/RegisterPlannerStep2";
import { RegisterPlannerStep3 } from "@/app/auth/RegisterPlannerStep3";
import { RegisterPlannerStep4 } from "@/app/auth/RegisterPlannerStep4";
import { RegisterVendorStep2 } from "@/app/auth/RegisterVendorStep2";
import { RegisterVendorStep3 } from "@/app/auth/RegisterVendorStep3";
import { EmailVerification } from "@/app/auth/EmailVerification";
import { OnboardingProvider } from "@/hooks/useOnboardingDraft";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="RegisterClientStep2" component={RegisterClientStep2} />
        <Stack.Screen name="RegisterClientStep3" component={RegisterClientStep3} />
        <Stack.Screen name="RegisterClientStep4" component={RegisterClientStep4} />
        <Stack.Screen name="RegisterPlannerStep2" component={RegisterPlannerStep2} />
        <Stack.Screen name="RegisterPlannerStep3" component={RegisterPlannerStep3} />
        <Stack.Screen name="RegisterPlannerStep4" component={RegisterPlannerStep4} />
        <Stack.Screen name="RegisterVendorStep2" component={RegisterVendorStep2} />
        <Stack.Screen name="RegisterVendorStep3" component={RegisterVendorStep3} />
        <Stack.Screen name="EmailVerification" component={EmailVerification} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}

export function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <NavigationContainer>
      {!isLoaded ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isSignedIn ? (
        <MainNavigator />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
