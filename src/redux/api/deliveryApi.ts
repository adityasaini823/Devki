import { baseApi } from './baseApi';

interface GetDeliveriesParams {
    status?: string;
    limit?: number;
}

// RTK Query API for Subscription Deliveries
export const deliveryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get user's deliveries (upcoming/past)
        getMyDeliveries: builder.query<any, GetDeliveriesParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.status) searchParams.append('status', params.status);
                if (params?.limit) searchParams.append('limit', String(params.limit));
                return `/deliveries/my-deliveries?${searchParams.toString()}`;
            },
            providesTags: ['Deliveries'],
        }),

        // Get user's delivery history
        getDeliveryHistory: builder.query<any, void>({
            query: () => ({
                url: '/deliveries/my-delivery-history',
                method: 'GET',
            }),
            providesTags: ['Deliveries'],
        }),

        // Skip a delivery (user)
        skipDelivery: builder.mutation({
            query: ({ id, notes }) => ({
                url: `/deliveries/${id}/skip`,
                method: 'PATCH',
                body: { notes },
            }),
            invalidatesTags: ['Deliveries'],
        }),
    }),
});

export const {
    useGetMyDeliveriesQuery,
    useSkipDeliveryMutation,
    useGetDeliveryHistoryQuery,
} = deliveryApi;
