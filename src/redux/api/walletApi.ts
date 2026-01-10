import { baseApi, ApiResponse } from './baseApi';

export interface WalletBalance {
  balance: number;
  user: {
    name: string;
  };
}

export interface WalletTransaction {
  _id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'rejected' | 'cancelled';
  payment_method?: string;
  payment_id?: string;
  bank_account?: {
    account_number: string;
    ifsc_code: string;
    account_holder_name: string;
  };
  remarks?: string;
  admin_remarks?: string;
  processed_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AddMoneyRequest {
  amount: number;
  payment_method?: string;
  payment_id?: string;
}

export interface WithdrawalRequest {
  amount: number;
  bank_account: {
    account_number: string;
    ifsc_code: string;
    account_holder_name: string;
  };
}

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletBalance: builder.query<WalletBalance, void>({
      query: () => '/wallet/balance',
      transformResponse: (response: ApiResponse<WalletBalance>) => {
        return response.data || { balance: 0, user: { name: '' } };
      },
      providesTags: ['Wallet'],
    }),
    getWalletTransactions: builder.query<
      WalletTransactionsResponse,
      { page?: number; limit?: number; type?: 'deposit' | 'withdrawal' }
    >({
      query: ({ page = 1, limit = 20, type }) => ({
        url: '/wallet/transactions',
        params: { page, limit, type },
      }),
      transformResponse: (response: ApiResponse<WalletTransactionsResponse>) => {
        return response.data || { transactions: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
      },
      providesTags: ['Wallet'],
    }),
    addMoneyToWallet: builder.mutation<
      { transaction: WalletTransaction; new_balance: number },
      AddMoneyRequest
    >({
      query: (body) => ({
        url: '/wallet/add-money',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet'],
    }),
    requestWithdrawal: builder.mutation<
      { transaction: WalletTransaction; new_balance: number },
      WithdrawalRequest
    >({
      query: (body) => ({
        url: '/wallet/withdraw',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet'],
    }),
  }),
});

export const {
  useGetWalletBalanceQuery,
  useGetWalletTransactionsQuery,
  useAddMoneyToWalletMutation,
  useRequestWithdrawalMutation,
} = walletApi;

