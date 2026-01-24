import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api';

interface Settings {
    payment: {
        upi_id: string;
        minimum_deposit: number;
        minimum_withdrawal: number;
    };
    general: {
        app_name: string;
        support_email: string;
    };
}

interface SettingsResponse {
    success: boolean;
    settings: Settings;
}

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_CONFIG.BASE_URL,
    }),
    tagTypes: ['Settings'],
    endpoints: (builder) => ({
        getSettings: builder.query<SettingsResponse, void>({
            query: () => '/settings',
            providesTags: ['Settings'],
        }),
    }),
});

export const { useGetSettingsQuery } = settingsApi;
