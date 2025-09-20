import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../_theme/ThemeProvider';
import StoreHeader from '../components/headers/StoreHeader';

export default function RootLayout() {
  const { theme } = useTheme();

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
          headerStyle: { backgroundColor: theme.colors.primary },
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
          header: () => <StoreHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart-sharp' : 'cart-outline'} color={color} size={24} />
          ),
            headerShown: true,
          }}
      />
    </Tabs>
  );
}
