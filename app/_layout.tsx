import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          headerTitle: 'Devki-Your Milky Way',
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => {/* open menu logic */}}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => {/* go to profile logic */}}>
              <Ionicons name="person-circle" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
