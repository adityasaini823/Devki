import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
export default function RootLayout() {
  
  return (
    <Tabs >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
        ), }} />
      <Tabs.Screen name="store" options={{ title: "Store", tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'cart-sharp' : 'cart-outline'} color={color} size={24} />
        ), }} />
    </Tabs>
  );
}
  