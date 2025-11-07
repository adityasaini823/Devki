import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="otp" 
        options={{ 
          title: 'Enter OTP',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="signup-details" 
        options={{ 
          title: 'Signup Details',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}

