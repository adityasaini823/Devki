import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#10B981', height: 'auto', minHeight: 60, paddingVertical: 8 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700'
      }}
      text2Style={{
        fontSize: 14,
        color: '#374151'
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={0}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', height: 'auto', minHeight: 60, paddingVertical: 8 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700'
      }}
      text2Style={{
        fontSize: 14,
        color: '#374151'
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={0}
    />
  )
};
