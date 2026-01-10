import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../_theme/ThemeProvider";
import StoreHeader from "../components/headers/StoreHeader";
import HomeHeader from "../components/headers/HomeHeader";

export default function RootLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 0,
          height: 64,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
          headerShown: true,
          headerTitle: "Devki-Your Milky Way",
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "#fff",
          headerRight: () => <HomeHeader />,
        }}
      />

      <Tabs.Screen
        name="subscription"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "water-sharp" : "water-outline"}
              color={color}
              size={24}
            />
          ),
          headerShown: false, // Hide default header since we have custom header
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          header: () => <StoreHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "storefront-sharp" : "storefront-outline"}
              color={color}
              size={24}
            />
          ),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt-sharp" : "receipt-outline"}
              color={color}
              size={24}
            />
          ),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person-sharp" : "person-outline"} color={color} size={24} />
          ),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          href: null,
          // tabBarButton: () => null, // Hide from tab bar but keep accessible via navigation
          headerShown: false, // Use custom header in component
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          href: null,
          // tabBarButton: () => null, // Hide from tab bar but keep accessible via navigation
          headerShown: false, // Use custom header in component
        }}
      />
    </Tabs>
  );
}
