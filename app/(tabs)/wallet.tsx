import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';
import WalletHeader from '../components/headers/WalletHeader';
import {
  useGetWalletBalanceQuery,
  useGetWalletTransactionsQuery,
  useAddMoneyToWalletMutation,
  useRequestWithdrawalMutation,
} from '../../src/redux/api/walletApi';
import { useGetProfileQuery } from '../../src/redux/api/authApi';
import ImageUpload from '../../src/components/common/ImageUpload';

export default function Wallet() {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'add-money' | 'withdraw'>('overview');
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyRemarks, setAddMoneyRemarks] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useGetWalletBalanceQuery(
    undefined,
    { pollingInterval: 30000 } // Poll every 30 seconds for balance updates
  );
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
    isFetching: isFetchingTransactions,
  } = useGetWalletTransactionsQuery(
    { page: 1, limit: 20 },
    { pollingInterval: 30000 } // Poll every 30 seconds for transaction updates
  );

  const { data: profileData } = useGetProfileQuery();
  const userId = profileData?.user?.id || 'unknown';
  const paymentFolder = `devki/payments/user_${userId}`;

  const [addMoney, { isLoading: isAddingMoney }] = useAddMoneyToWalletMutation();
  const [requestWithdrawal, { isLoading: isRequestingWithdrawal }] = useRequestWithdrawalMutation();

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchBalance(), refetchTransactions()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchBalance, refetchTransactions]);

  const balance = balanceData?.balance || 0;
  const transactions = transactionsData?.transactions || [];

  const handleAddMoney = async () => {
    const amount = parseFloat(addMoneyAmount);
    if (!amount || amount < 10) {
      Alert.alert('Invalid Amount', 'Minimum deposit amount is ₹10');
      return;
    }

    if (!paymentProofUrl) {
      Alert.alert('Payment Proof Required', 'Please upload a screenshot of your payment');
      return;
    }

    if (!transactionId) {
      Alert.alert('Transaction ID Required', 'Please enter the UPI Transaction ID');
      return;
    }

    try {
      await addMoney({
        amount,
        payment_method: 'upi',
        payment_id: transactionId,
        payment_proof: paymentProofUrl,
        remarks: addMoneyRemarks || undefined
      }).unwrap();
      Alert.alert(
        'Request Submitted',
        `Your request to add ₹${amount} has been submitted successfully with proof. The amount will be credited once verified by admin.`
      );
      setAddMoneyAmount('');
      setAddMoneyRemarks('');
      setPaymentProofUrl('');
      setTransactionId('');
      setActiveTab('overview');
      // Refetch both balance and transactions
      refetchBalance();
      refetchTransactions();
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to submit request. Please try again.');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is ₹100');
      return;
    }

    if (!bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
      Alert.alert('Missing Details', 'Please fill all bank account details');
      return;
    }

    if (amount > balance) {
      Alert.alert('Insufficient Balance', `Your wallet balance is ₹${balance}`);
      return;
    }

    try {
      await requestWithdrawal({ amount, bank_account: bankDetails }).unwrap();
      Alert.alert(
        'Success',
        'Withdrawal request submitted successfully. It will be processed within 2-3 business days.'
      );
      setWithdrawAmount('');
      setBankDetails({ account_number: '', ifsc_code: '', account_holder_name: '' });
      setShowWithdrawModal(false);
      setActiveTab('overview');
      // Refetch both balance and transactions
      refetchBalance();
      refetchTransactions();
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to request withdrawal. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
      case 'cancelled':
        return '#EF4444';
      default:
        return theme.colors.muted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header */}
      <WalletHeader />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          {isLoadingBalance ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          )}
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'add-money' && styles.activeTab]}
            onPress={() => setActiveTab('add-money')}
          >
            <Text style={[styles.tabText, activeTab === 'add-money' && styles.activeTabText]}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'withdraw' && styles.activeTab]}
            onPress={() => setActiveTab('withdraw')}
          >
            <Text style={[styles.tabText, activeTab === 'withdraw' && styles.activeTabText]}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Transactions</Text>
              {isFetchingTransactions && !isLoadingTransactions && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </View>
            {isLoadingTransactions ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.muted} />
                <Text style={[styles.emptyText, { color: theme.colors.muted }]}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((transaction) => (
                  <View key={transaction._id} style={[styles.transactionItem, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              transaction.transaction_type === 'deposit'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                          },
                        ]}
                      >
                        <Ionicons
                          name={transaction.transaction_type === 'deposit' ? 'arrow-down' : 'arrow-up'}
                          size={20}
                          color={transaction.transaction_type === 'deposit' ? '#10B981' : '#EF4444'}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={[styles.transactionType, { color: theme.colors.text }]}>
                          {transaction.transaction_type === 'deposit'
                            ? (transaction.status === 'completed' ? 'Money Added' : 'Deposit Request')
                            : 'Withdrawal Request'}
                        </Text>
                        <Text style={[styles.transactionDate, { color: theme.colors.muted }]}>
                          {formatDate(transaction.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              transaction.transaction_type === 'deposit' ? '#10B981' : theme.colors.text,
                          },
                        ]}
                      >
                        {transaction.transaction_type === 'deposit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(transaction.status) + '20' },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'add-money' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add Money to Wallet</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>₹</Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.colors.text }]}
                  placeholder="Enter amount (min ₹10)"
                  placeholderTextColor={theme.colors.muted}
                  value={addMoneyAmount}
                  onChangeText={setAddMoneyAmount}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quickAmounts}>
                {[100, 500, 1000, 2000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.quickAmountButton, { backgroundColor: theme.colors.background }]}
                    onPress={() => setAddMoneyAmount(amount.toString())}
                  >
                    <Text style={[styles.quickAmountText, { color: theme.colors.text }]}>₹{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Remarks (Optional)</Text>
              <TextInput
                style={[styles.remarksInput, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                placeholder="e.g., Payment reference, UPI ID used, etc."
                placeholderTextColor={theme.colors.muted}
                value={addMoneyRemarks}
                onChangeText={setAddMoneyRemarks}
                multiline
                numberOfLines={2}
              />
              <Text style={[styles.helperText, { color: theme.colors.muted }]}>
                Add any reference details to help admin verify your payment
              </Text>
            </View>

            {/* UPI Payment Details Section */}
            <View style={[styles.paymentInstructionContainer, { backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: theme.colors.primary }]}>
              <Text style={[styles.instructionTitle, { color: theme.colors.primary }]}>Payment Instructions</Text>
              <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                1. Open your preferred UPI app (Google Pay, PhonePe, etc.)
              </Text>
              <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                2. Pay ₹{addMoneyAmount || '0'} to the UPI ID below:
              </Text>

              <View style={[styles.upiIdContainer, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.upiIdText, { color: theme.colors.text }]}>adityasaini2468@okicici</Text>
                <TouchableOpacity
                  onPress={() => {
                    // In a real app, you'd copy to clipboard here
                    Alert.alert('Copied', 'UPI ID copied to clipboard');
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.instructionText, { color: theme.colors.text, marginTop: 8 }]}>
                3. Enter the UPI Transaction ID / Ref No. below:
              </Text>
              <TextInput
                style={[styles.transactionIdInput, { color: theme.colors.text, backgroundColor: theme.colors.card, borderColor: theme.colors.muted + '40' }]}
                placeholder="UPI Transaction ID (12 digits)"
                placeholderTextColor={theme.colors.muted}
                value={transactionId}
                onChangeText={setTransactionId}
              />

              <Text style={[styles.instructionText, { color: theme.colors.text, marginTop: 8 }]}>
                4. Upload the screenshot of the successful payment:
              </Text>
              <View style={styles.uploadWrapper}>
                <ImageUpload
                  onUploadComplete={(url) => setPaymentProofUrl(url)}
                  initialImage={paymentProofUrl || undefined}
                  folder={paymentFolder}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
                (!addMoneyAmount || !transactionId || !paymentProofUrl) && styles.disabledButton
              ]}
              onPress={handleAddMoney}
              disabled={isAddingMoney || !addMoneyAmount || !transactionId || !paymentProofUrl}
            >
              {isAddingMoney ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
            <Text style={[styles.noteText, { color: theme.colors.muted }]}>
              Note: Your wallet will be credited once the admin approves your request.
            </Text>
          </View>
        )}

        {activeTab === 'withdraw' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Request Withdrawal</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>₹</Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.colors.text }]}
                  placeholder="Enter amount (min ₹100)"
                  placeholderTextColor={theme.colors.muted}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                />
              </View>
              <Text style={[styles.helperText, { color: theme.colors.muted }]}>
                Available balance: ₹{balance.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                {bankDetails.account_number ? 'Update Bank Details' : 'Add Bank Details'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
                (!withdrawAmount || !bankDetails.account_number) && styles.disabledButton,
              ]}
              onPress={handleWithdraw}
              disabled={isRequestingWithdrawal || !withdrawAmount || !bankDetails.account_number}
            >
              {isRequestingWithdrawal ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Request Withdrawal</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bank Details Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Bank Account Details</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Account Holder Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                  placeholder="Enter account holder name"
                  placeholderTextColor={theme.colors.muted}
                  value={bankDetails.account_holder_name}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, account_holder_name: text })}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Account Number</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                  placeholder="Enter account number"
                  placeholderTextColor={theme.colors.muted}
                  value={bankDetails.account_number}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, account_number: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>IFSC Code</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
                  placeholder="Enter IFSC code"
                  placeholderTextColor={theme.colors.muted}
                  value={bankDetails.ifsc_code}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, ifsc_code: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  remarksInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginTop: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paymentInstructionContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  upiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  upiIdText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  transactionIdInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    fontSize: 14,
  },
  uploadWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
});

