import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide default headers - each screen has its own custom header
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="otp" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="signup-details" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

