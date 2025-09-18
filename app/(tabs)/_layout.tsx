import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity } from 'react-native';
export default function RootLayout() {
  return (
    <Tabs screenOptions={{ tabBarShowLabel: false }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
          headerShown: true,
          headerTitle: 'Devki-Your Milky Way',
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={() => {alert('Profile pressed');}}>
              <Ionicons name="person-circle" size={36} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          headerTitleStyle: { color: '#fff' },
          headerStyle: { backgroundColor: '#6200ee' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => {alert('Back pressed');}}>
              <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart-sharp' : 'cart-outline'} color={color} size={24} />
          ),
            headerShown: true,
          }}
      />
    </Tabs>
  );
}
