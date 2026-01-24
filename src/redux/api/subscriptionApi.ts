import { baseApi } from './baseApi';
import { ApiResponse } from './baseApi';

export interface SubscriptionProduct {
  id: string;
  quantity: '1L' | '2L' | '3L' | '5L';
  name: string;
  price_per_delivery: number;
  image?: string;
}

export interface Subscription {
  id: string;
  subscription_product: SubscriptionProduct;
  price_per_delivery: number;
  delivery_time: 'morning' | 'evening';
  frequency: 'daily' | 'weekdays' | 'weekly' | 'biweekly';
  deliveries_per_month: number;
  monthly_estimate: number;
  status: 'active' | 'paused' | 'cancelled';
  start_date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  subscription_product_id: string;
  delivery_time: 'morning' | 'evening';
  frequency: 'daily' | 'weekdays' | 'weekly' | 'biweekly';
}

export interface CreateSubscriptionResponse extends ApiResponse {
  subscription: Subscription;
}

export interface GetSubscriptionResponse extends ApiResponse {
  subscription: Subscription | null;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create or update subscription
    createOrUpdateSubscription: builder.mutation<CreateSubscriptionResponse, CreateSubscriptionRequest>({
      query: (body) => ({
        url: '/subscriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    // Get user's subscription
    getSubscription: builder.query<GetSubscriptionResponse, void>({
      query: () => ({
        url: '/subscriptions',
        method: 'GET',
      }),
      providesTags: ['Subscription'],
    }),

    // Pause subscription
    pauseSubscription: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/subscriptions/pause',
        method: 'PATCH',
      }),
      invalidatesTags: ['Subscription'],
    }),

    // Cancel subscription
    cancelSubscription: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/subscriptions/cancel',
        method: 'PATCH',
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useCreateOrUpdateSubscriptionMutation,
  useGetSubscriptionQuery,
  usePauseSubscriptionMutation,
  useCancelSubscriptionMutation,
} = subscriptionApi;

