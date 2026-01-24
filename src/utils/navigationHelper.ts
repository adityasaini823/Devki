import * as Linking from 'expo-linking';

// Navigation helper to avoid circular dependencies
// This will be used by baseApi to redirect to login when tokens expire
let navigationRef: any = null;

export const navigationHelper = {
  setNavigationRef: (ref: any) => {
    navigationRef = ref;
  },

  navigateToLogin: () => {
    // Use Linking to navigate to login screen
    // This works even when called from outside React components
    if (typeof window !== 'undefined') {
      // For web
      window.location.href = '/login';
    } else {
      // For mobile, we'll use a different approach
      // The baseApi will handle this by clearing tokens
      // and the app/index.tsx will redirect based on token check
      Linking.openURL('exp://localhost:8081/--/(auth)/login').catch(() => {
        // Fallback - tokens are cleared, app will redirect on next navigation
      });
    }
  },
};

