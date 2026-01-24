import { baseApi } from './baseApi';
import { ApiResponse } from './baseApi';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_price: number;
  product_image?: string;
  category?: string;
  quantity: number;
  total_price: number;
}

export interface DeliveryAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: DeliveryAddress;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResponse extends ApiResponse {
  data: {
    order: Order;
    new_wallet_balance: number;
  };
}

export interface GetOrdersResponse extends ApiResponse {
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetOrderResponse extends ApiResponse {
  data: {
    order: Order;
  };
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Checkout - Create order from cart
    checkout: builder.mutation<CheckoutResponse, void>({
      query: () => ({
        url: '/orders/checkout',
        method: 'POST',
      }),
      invalidatesTags: ['Cart', 'Wallet', 'Order'],
    }),

    // Get user's orders
    getOrders: builder.query<
      GetOrdersResponse,
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 20, status }) => ({
        url: '/orders',
        params: { page, limit, status },
      }),
      transformResponse: (response: ApiResponse<GetOrdersResponse['data']>) => {
        return {
          success: response.success,
          message: response.message,
          data: response.data || { orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
        };
      },
      providesTags: ['Order'],
    }),

    // Get single order by ID
    getOrderById: builder.query<GetOrderResponse, string>({
      query: (id) => ({
        url: `/orders/${id}`,
      }),
      transformResponse: (response: ApiResponse<GetOrderResponse['data']>): GetOrderResponse => {
        if (response.data && response.data.order) {
          return {
            success: response.success,
            message: response.message,
            data: response.data,
          };
        }
        // Return a valid response structure even if order is not found
        return {
          success: false,
          message: 'Order not found',
          data: {
            order: {
              id: '',
              order_number: '',
              items: [],
              total_amount: 0,
              payment_method: 'wallet',
              payment_status: 'pending',
              order_status: 'pending',
              delivery_address: {
                address: '',
                city: '',
                state: '',
                pincode: '',
                country: '',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        };
      },
      providesTags: ['Order'],
    }),
  }),
});

export const {
  useCheckoutMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
} = orderApi;

