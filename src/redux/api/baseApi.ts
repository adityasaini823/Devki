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
  status: number;
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
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && (result.error as ApiError).status === 401) {
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

        const refreshData = await refreshResult.json();

        if (refreshData.success && refreshData.token) {
          // Save new access token
          await tokenStorage.saveToken(refreshData.token);
          
          // Retry the original request with new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, clear tokens and logout
          await tokenStorage.removeToken();
        }
      } catch (error) {
        // Refresh failed, clear tokens
        await tokenStorage.removeToken();
      }
    } else {
      // No refresh token, clear everything
      await tokenStorage.removeToken();
    }
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth', 'Subscription', 'SubscriptionProduct', 'Product', 'Cart'],
  endpoints: () => ({}),
});

