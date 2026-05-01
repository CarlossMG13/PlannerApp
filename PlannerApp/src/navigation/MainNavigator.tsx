import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

import { useUserStore } from "@/store/userStore";
import { colors } from "@/constants/theme";

import { ClientDashboardScreen } from "@/app/client/ClientDashboardScreen";
import { PlannerDashboardScreen } from "@/app/planner/PlannerDashboardScreen";
import { VendorDashboardScreen } from "@/app/vendor/VendorDashboardScreen";
import { CreateEventScreen } from "@/app/client/CreateEventScreen";
import { EventDetailScreen } from "@/app/client/EventDetailScreen";

import {
  ClientStackParamList,
  ClientTabParamList,
  PlannerTabParamList,
  VendorTabParamList,
} from "./types";

const ClientStack = createNativeStackNavigator<ClientStackParamList>();
const ClientTab = createBottomTabNavigator<ClientTabParamList>();
const PlannerTab = createBottomTabNavigator<PlannerTabParamList>();
const VendorTab = createBottomTabNavigator<VendorTabParamList>();

const tabBarStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  height: 60,
  paddingBottom: 8,
  paddingTop: 6,
};

const tabBarLabelStyle = {
  fontSize: 11,
  fontWeight: "600" as const,
};

function PlaceholderScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function ClientTabs() {
  return (
    <ClientTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            ClientHome: "home",
            ClientEvents: "calendar",
            ClientProfile: "person",
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <ClientTab.Screen name="ClientHome" component={ClientDashboardScreen} options={{ title: "Inicio" }} />
      <ClientTab.Screen name="ClientEvents" component={PlaceholderScreen} options={{ title: "Eventos" }} />
      <ClientTab.Screen name="ClientProfile" component={PlaceholderScreen} options={{ title: "Perfil" }} />
    </ClientTab.Navigator>
  );
}

function ClientNavigator() {
  return (
    <ClientStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <ClientStack.Screen name="ClientTabs" component={ClientTabs} />
      <ClientStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <ClientStack.Screen name="EventDetail" component={EventDetailScreen} />
    </ClientStack.Navigator>
  );
}

function PlannerTabs() {
  return (
    <PlannerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            PlannerHome: "home",
            PlannerEvents: "calendar",
            PlannerProfile: "person",
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <PlannerTab.Screen name="PlannerHome" component={PlannerDashboardScreen} options={{ title: "Inicio" }} />
      <PlannerTab.Screen name="PlannerEvents" component={PlaceholderScreen} options={{ title: "Eventos" }} />
      <PlannerTab.Screen name="PlannerProfile" component={PlaceholderScreen} options={{ title: "Perfil" }} />
    </PlannerTab.Navigator>
  );
}

function VendorTabs() {
  return (
    <VendorTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            VendorHome: "home",
            VendorServices: "briefcase",
            VendorProfile: "person",
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <VendorTab.Screen name="VendorHome" component={VendorDashboardScreen} options={{ title: "Inicio" }} />
      <VendorTab.Screen name="VendorServices" component={PlaceholderScreen} options={{ title: "Servicios" }} />
      <VendorTab.Screen name="VendorProfile" component={PlaceholderScreen} options={{ title: "Perfil" }} />
    </VendorTab.Navigator>
  );
}

export function MainNavigator() {
  const { getToken } = useAuth();
  const { user, loading, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(getToken);
  }, []);

  if (loading || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user.role === "PLANNER") return <PlannerTabs />;
  if (user.role === "VENDOR") return <VendorTabs />;
  return <ClientNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
