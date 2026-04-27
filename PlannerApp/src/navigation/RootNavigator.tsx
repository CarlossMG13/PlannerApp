import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "@/app/auth/LoginScreen";
import { RegisterScreen } from "@/app/auth/RegisterScreen";
import { RootStackParamList } from "./types";

// Screens Register Client
import { RegisterClientStep2 } from "@/app/auth/RegisterClientStep2";
import { RegisterClientStep3 } from "@/app/auth/RegisterClientStep3";
import { RegisterClientStep4 } from "@/app/auth/RegisterClientStep4";

// Screens Register Planner
import { RegisterPlannerStep2 } from "@/app/auth/RegisterPlannerStep2";
import { RegisterPlannerStep3 } from "@/app/auth/RegisterPlannerStep3";

// Email Verification Screen
import { EmailVerification } from "@/app/auth/EmailVerification";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="RegisterClientStep2"
          component={RegisterClientStep2}
        />
        <Stack.Screen
          name="RegisterClientStep3"
          component={RegisterClientStep3}
        />
        <Stack.Screen
          name="RegisterClientStep4"
          component={RegisterClientStep4}
        />
        <Stack.Screen
          name="RegisterPlannerStep2"
          component={RegisterPlannerStep2}
        />
        <Stack.Screen name="EmailVerification" component={EmailVerification} />
        <Stack.Screen
          name="RegisterPlannerStep3"
          component={RegisterPlannerStep3}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
