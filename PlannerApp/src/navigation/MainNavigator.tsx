import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

import { useUserStore } from "@/store/userStore";
import { colors } from "@/constants/theme";

import { ClientDashboardScreen } from "@/app/client/ClientDashboardScreen";
import { ClientEventsScreen } from "@/app/client/ClientEventsScreen";
import { PlannerDashboardScreen } from "@/app/planner/PlannerDashboardScreen";
import { PlannerEventsScreen } from "@/app/planner/PlannerEventsScreen";
import { VendorDashboardScreen } from "@/app/vendor/VendorDashboardScreen";
import { VendorServicesScreen } from "@/app/vendor/VendorServicesScreen";
import { CreateEventScreen } from "@/app/client/CreateEventScreen";
import { EventDetailScreen } from "@/app/client/EventDetailScreen";
import { ProfileScreen } from "@/app/shared/ProfileScreen";

import {
  ClientStackParamList,
  ClientTabParamList,
  PlannerStackParamList,
  PlannerTabParamList,
  VendorTabParamList,
  VendorStackParamList,
} from "./types";

const ClientStack = createNativeStackNavigator<ClientStackParamList>();
const PlannerStack = createNativeStackNavigator<PlannerStackParamList>();
const VendorStack = createNativeStackNavigator<VendorStackParamList>();
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
      <ClientTab.Screen name="ClientEvents" component={ClientEventsScreen} options={{ title: "Eventos" }} />
      <ClientTab.Screen name="ClientProfile" component={ProfileScreen} options={{ title: "Perfil" }} />
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

function PlannerNavigator() {
  return (
    <PlannerStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <PlannerStack.Screen name="PlannerTabs" component={PlannerTabs} />
      <PlannerStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <PlannerStack.Screen name="EventDetail" component={EventDetailScreen} />
    </PlannerStack.Navigator>
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
      <PlannerTab.Screen name="PlannerEvents" component={PlannerEventsScreen} options={{ title: "Eventos" }} />
      <PlannerTab.Screen name="PlannerProfile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </PlannerTab.Navigator>
  );
}

function VendorNavigator() {
  return (
    <VendorStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <VendorStack.Screen name="VendorTabs" component={VendorTabs} />
      <VendorStack.Screen name="EventDetail" component={EventDetailScreen} />
    </VendorStack.Navigator>
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
      <VendorTab.Screen name="VendorServices" component={VendorServicesScreen} options={{ title: "Servicios" }} />
      <VendorTab.Screen name="VendorProfile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </VendorTab.Navigator>
  );
}

export function MainNavigator() {
  const { getToken } = useAuth();
  const { user, loading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(getToken);
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loading}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>{error ?? "No se pudo cargar el perfil"}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchUser(getToken)}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (user.role === "PLANNER") return <PlannerNavigator />;
  if (user.role === "VENDOR") return <VendorNavigator />;
  return <ClientNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
