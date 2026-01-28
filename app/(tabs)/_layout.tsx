import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity, View, Platform } from "react-native";
import { useTheme } from "../_theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StoreHeader from "../components/headers/StoreHeader";
import HomeHeader from "../components/headers/HomeHeader";
import OrdersHeader from "../components/headers/OrdersHeader";

export default function RootLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true, // Useful on Android
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === 'ios' ? 88 : 70 + (insets.bottom > 0 ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? 30 : (insets.bottom > 0 ? insets.bottom : 12),
          paddingTop: 12,
        },
        tabBarItemStyle: {
          height: 48,
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
              size={28} // Increased size
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
              size={28} // Increased size
            />
          ),
          headerShown: false, // Hide default header since we have custom header
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "My Deliveries",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bicycle" : "bicycle-outline"}
              color={color}
              size={28} // Increased size
            />
          ),
          headerShown: false, // Use custom header in component
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
              size={28} // Increased size
            />
          ),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          header: () => <OrdersHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt-sharp" : "receipt-outline"}
              color={color}
              size={28} // Increased size
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
            <Ionicons name={focused ? "person-sharp" : "person-outline"} color={color} size={28} />
          ),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
