import { baseApi } from './baseApi';
import { ApiResponse } from './baseApi';

export interface SubscriptionProduct {
  id: string;
  quantity: '1L' | '2L' | '3L' | '5L';
  name: string;
  price_per_unit: number;
  price_per_delivery: number;
  image?: string;
  description?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetSubscriptionProductsResponse extends ApiResponse {
  products: SubscriptionProduct[];
}

export interface GetSubscriptionProductResponse extends ApiResponse {
  product: SubscriptionProduct;
}

export const subscriptionProductApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all active subscription products
    getSubscriptionProducts: builder.query<GetSubscriptionProductsResponse, void>({
      query: () => ({
        url: '/subscription-products',
        method: 'GET',
      }),
      providesTags: ['SubscriptionProduct'],
    }),

    // Get single subscription product
    getSubscriptionProduct: builder.query<GetSubscriptionProductResponse, string>({
      query: (id) => ({
        url: `/subscription-products/${id}`,
        method: 'GET',
      }),
      providesTags: ['SubscriptionProduct'],
    }),
  }),
});

export const {
  useGetSubscriptionProductsQuery,
  useGetSubscriptionProductQuery,
} = subscriptionProductApi;

