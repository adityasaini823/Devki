import { baseApi } from './baseApi';
import { ApiResponse } from './baseApi';

export interface Product {
  id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  product_stock: number;
  category?: string;
  description?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsResponse extends ApiResponse {
  products: Product[];
  count: number;
}

export interface GetProductResponse extends ApiResponse {
  product: Product;
}

export interface CreateProductRequest {
  product_name: string;
  product_price: number;
  product_image: string;
  product_stock: number;
  category?: string;
  description?: string;
}

export interface CreateProductResponse extends ApiResponse {
  product: Product;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all active products
    getProducts: builder.query<GetProductsResponse, { category?: string; search?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);
        if (params?.search) queryParams.append('search', params.search);
        
        const queryString = queryParams.toString();
        return {
          url: `/products${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Product'],
    }),

    // Get single product
    getProduct: builder.query<GetProductResponse, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET',
      }),
      providesTags: ['Product'],
    }),

    // Create product (admin)
    createProduct: builder.mutation<CreateProductResponse, CreateProductRequest>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),

    // Update product (admin)
    updateProduct: builder.mutation<ApiResponse, { id: string; data: Partial<CreateProductRequest> }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),

    // Delete product (admin)
    deleteProduct: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;

