import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api';
import { tokenStorage } from '../../utils/tokenStorage';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ApiError {
  data?: {
    success: boolean;
    message?: string;
  };
  status?: number | string;
  error?: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: async (headers) => {
    headers.set('Content-Type', 'application/json');
    const token = await tokenStorage.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
  // Add timeout and better error handling
  timeout: 10000,
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Log error for debugging
  if (result.error) {
    console.log('API Error:', {
      status: (result.error as ApiError)?.status,
      data: (result.error as ApiError)?.data,
      endpoint: args?.url || 'unknown',
    });
  }
  
  // Handle both 401 (Unauthorized) and 403 (Forbidden - expired token)
  const errorStatus = (result.error as ApiError)?.status;
  const isUnauthorized = errorStatus === 401 || errorStatus === 403;
  
  // Only attempt refresh for authenticated endpoints (not for login/signup)
  const isAuthEndpoint = args?.url?.includes('/auth/send-login-otp') || 
                         args?.url?.includes('/auth/verify-login-otp') ||
                         args?.url?.includes('/auth/signup') ||
                         args?.url?.includes('/auth/verify-signup-otp') ||
                         args?.url?.includes('/auth/complete-profile');
  
  if (result.error && isUnauthorized && !isAuthEndpoint) {
    // Try to refresh the token
    const refreshToken = await tokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        // Call refresh token endpoint
        const refreshResult = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        // Check if refresh token endpoint returned 403 (expired refresh token)
        if (refreshResult.status === 403) {
          // Refresh token expired, clear all tokens
          console.log('Refresh token expired, clearing tokens');
          await tokenStorage.removeToken();
          return result; // Return original error, tokens are cleared
        }

        const refreshData = await refreshResult.json();

        if (refreshData.success && refreshData.token) {
          // Save new access token
          await tokenStorage.saveToken(refreshData.token);
          console.log('Access token refreshed successfully');
          
          // Retry the original request with new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed (invalid refresh token or other error)
          console.log('Token refresh failed:', refreshData.message || 'Unknown error');
          await tokenStorage.removeToken();
        }
      } catch (error) {
        // Network error or other exception during refresh
        console.error('Token refresh error:', error);
        await tokenStorage.removeToken();
      }
    } else {
      // No refresh token, clear everything and redirect to login
      await tokenStorage.removeToken();
      setTimeout(() => {
        // The app/index.tsx will handle redirect based on token check
      }, 100);
    }
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth', 'Subscription', 'SubscriptionProduct', 'Product', 'Cart', 'Wallet', 'Order'],
  endpoints: () => ({}),
});

