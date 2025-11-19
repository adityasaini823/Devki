import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../src/redux/store';
import ThemeProvider from './_theme/ThemeProvider';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
}
