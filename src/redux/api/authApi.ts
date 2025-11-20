import { baseApi, ApiResponse } from './baseApi';

export interface SendOTPRequest {
  mobile: string;
}

export interface SendOTPResponse extends ApiResponse {
  otpSent: boolean;
  userExists?: boolean;
  otp?: string;
}

export interface VerifyOTPRequest {
  mobile: string;
  otp: string;
}

export interface VerifyOTPResponse extends ApiResponse {
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    mobile: string;
    first_name: string;
    last_name?: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  needsProfile?: boolean;
}

export interface CompleteProfileRequest {
  mobile: string;
  first_name: string;
  last_name?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CompleteProfileResponse extends ApiResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    mobile: string;
    first_name: string;
    last_name?: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends ApiResponse {
  token: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendLoginOTP: builder.mutation<SendOTPResponse, SendOTPRequest>({
      query: (body) => ({
        url: '/auth/send-login-otp',
        method: 'POST',
        body: {
          mobile: `+91${body.mobile}`,
        },
      }),
      invalidatesTags: ['Auth'],
    }),

    verifyOTP: builder.mutation<VerifyOTPResponse, VerifyOTPRequest>({
      query: (body) => ({
        url: '/auth/verify-login-otp',
        method: 'POST',
        body: {
          mobile: `+91${body.mobile}`,
          otp: body.otp,
        },
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    completeProfile: builder.mutation<CompleteProfileResponse, CompleteProfileRequest>({
      query: (body) => ({
        url: '/auth/complete-profile',
        method: 'POST',
        body: {
          ...body,
          mobile: `+91${body.mobile}`,
        },
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body,
      }),
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
});

export const {
  useSendLoginOTPMutation,
  useVerifyOTPMutation,
  useCompleteProfileMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;

