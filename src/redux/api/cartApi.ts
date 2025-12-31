import { baseApi } from './baseApi';
import { ApiResponse } from './baseApi';

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image?: string;
  category?: string;
  quantity: number;
  total_price: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetCartResponse extends ApiResponse {
  items: CartItem[];
  count: number;
  cartTotal: number;
}

export interface AddOrUpdateCartRequest {
  product_id: string;
  quantity?: number;
}

export interface AddOrUpdateCartResponse extends ApiResponse {
  item: CartItem;
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user's cart
    getCart: builder.query<GetCartResponse, void>({
      query: () => ({
        url: '/cart',
        method: 'GET',
      }),
      providesTags: ['Cart'],
    }),

    // Add or update cart item
    addOrUpdateCartItem: builder.mutation<
      AddOrUpdateCartResponse,
      AddOrUpdateCartRequest
    >({
      query: (body) => ({
        url: '/cart',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),

    // Update quantity of a specific cart item
    updateCartItemQuantity: builder.mutation<
      ApiResponse,
      { id: string; quantity: number }
    >({
      query: ({ id, quantity }) => ({
        url: `/cart/${id}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    // Remove a specific cart item
    removeCartItem: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/cart/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    // Clear entire cart
    clearCart: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddOrUpdateCartItemMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;


