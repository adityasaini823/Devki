import React, { useState, useCallback, useRef } from 'react';
import Toast from 'react-native-toast-message';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    RefreshControl,
    Platform,
    KeyboardAvoidingView,
    Pressable,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../_theme/ThemeProvider';
import WalletHeader from '../components/headers/WalletHeader';
import {
    useGetWalletBalanceQuery,
    useGetWalletTransactionsQuery,
    useAddMoneyToWalletMutation,
    useRequestWithdrawalMutation,
} from '../../src/redux/api/walletApi';
import { useGetProfileQuery } from '../../src/redux/api/authApi';
import { useGetSettingsQuery } from '../../src/redux/api/settingsApi';
import { uploadImage } from '../../src/api/adminApi';
import { toastConfig } from '../../src/config/toastConfig';

export default function WalletScreen() {
    const { theme } = useTheme();
    const router = useRouter();

    // Toast Refs
    const addMoneyToastRef = useRef<any>(null);
    const withdrawToastRef = useRef<any>(null);

    // API Queries
    const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useGetWalletBalanceQuery(
        undefined,
        { pollingInterval: 30000 }
    );
    const {
        data: transactionsData,
        isLoading: isLoadingTransactions,
        isFetching: isFetchingTransactions,
        refetch: refetchTransactions
    } = useGetWalletTransactionsQuery(
        { page: 1, limit: 20 },
        { pollingInterval: 30000 }
    );
    const { data: settingsData, isLoading: isLoadingSettings } = useGetSettingsQuery();
    const { data: profileData } = useGetProfileQuery();

    // API Mutations
    const [addMoney, { isLoading: isAddingMoney }] = useAddMoneyToWalletMutation();
    const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();

    // UI State
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [addMoneyAmount, setAddMoneyAmount] = useState('');
    const [addMoneyRemarks, setAddMoneyRemarks] = useState('');
    const [paymentProofUrl, setPaymentProofUrl] = useState('');

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({
        account_number: '',
        ifsc_code: '',
        account_holder_name: '',
    });

    const balance = balanceData?.balance || 0;
    const transactions = transactionsData?.transactions || [];
    const upiId = settingsData?.settings?.payment?.upi_id || 'adityasaini2468@okicici';
    const userId = profileData?.user?.id || 'unknown';
    const paymentFolder = `devki/payments/user_${userId}`;

    useFocusEffect(
        useCallback(() => {
            refetchBalance();
            refetchTransactions();
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([refetchBalance(), refetchTransactions()]);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchBalance, refetchTransactions]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0]);
        }
    };

    const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            if (Platform.OS === 'web') {
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                formData.append('image', blob, 'upload.jpg');
            } else {
                const localUri = asset.uri;
                const filename = localUri.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                // @ts-ignore
                formData.append('image', { uri: localUri, name: filename, type });
            }

            const response = await uploadImage(formData, paymentFolder);
            if (response && response.success) {
                setPaymentProofUrl(response.data.url);
                addMoneyToastRef.current?.show({ type: 'success', text1: 'Image Uploaded' });
            } else {
                addMoneyToastRef.current?.show({ type: 'error', text1: 'Upload Failed', text2: response?.message });
            }
        } catch (err: any) {
            addMoneyToastRef.current?.show({ type: 'error', text1: 'Upload Failed', text2: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddMoney = async () => {
        const amount = parseFloat(addMoneyAmount);
        if (!amount || amount < 10) {
            addMoneyToastRef.current?.show({ type: 'error', text1: 'Invalid Amount', text2: 'Minimum deposit amount is ₹10' });
            return;
        }

        if (!paymentProofUrl) {
            addMoneyToastRef.current?.show({ type: 'error', text1: 'Proof Required', text2: 'Please upload a payment screenshot' });
            return;
        }

        try {
            await addMoney({
                amount,
                payment_method: 'upi',
                payment_id: 'MANUAL_UPLOAD',
                payment_proof: paymentProofUrl,
                remarks: addMoneyRemarks || 'Funds added via UPI screenshot'
            }).unwrap();

            setIsAddModalVisible(false);
            Toast.show({ type: 'success', text1: 'Success', text2: `₹${amount} add request submitted` });

            setAddMoneyAmount('');
            setAddMoneyRemarks('');
            setPaymentProofUrl('');
            refetchBalance();
            refetchTransactions();
        } catch (error: any) {
            addMoneyToastRef.current?.show({
                type: 'error',
                text1: 'Error',
                text2: error?.data?.message || 'Failed to submit request'
            });
        }
    };

    const handleWithdrawal = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            withdrawToastRef.current?.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid amount' });
            return;
        }

        if (amount > balance) {
            withdrawToastRef.current?.show({ type: 'error', text1: 'Insufficient Balance', text2: 'You cannot withdraw more than your balance' });
            return;
        }

        if (!bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
            withdrawToastRef.current?.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill all bank details' });
            return;
        }

        try {
            await requestWithdrawal({
                amount,
                bank_account: bankDetails
            }).unwrap();

            setIsWithdrawModalVisible(false);
            Toast.show({ type: 'success', text1: 'Request Sent', text2: 'Withdrawal request submitted successfully' });

            setWithdrawAmount('');
            setBankDetails({ account_number: '', ifsc_code: '', account_holder_name: '' });
            refetchBalance();
            refetchTransactions();
        } catch (error: any) {
            withdrawToastRef.current?.show({
                type: 'error',
                text1: 'Error',
                text2: error?.data?.message || 'Failed to request withdrawal'
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'rejected':
            case 'cancelled': return '#EF4444';
            default: return theme.colors.muted;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <WalletHeader />

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
                contentContainerStyle={styles.content}
            >
                {/* Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    {isLoadingBalance ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
                    )}
                    <View style={styles.cardInfo}>
                        <View>
                            <Text style={styles.infoLabel}>Account Status</Text>
                            <Text style={styles.infoValue}>Active</Text>
                        </View>
                        <Ionicons name="card-outline" size={40} color="rgba(255,255,255,0.3)" />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
                        onPress={() => setIsAddModalVisible(true)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                            <Ionicons name="add" size={24} color="#0EA5E9" />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>Add Money</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
                        onPress={() => setIsWithdrawModalVisible(true)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="arrow-undo" size={24} color="#22C55E" />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>Transfer</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Transactions</Text>

                    {transactions.length > 0 ? (
                        transactions.map((tx: any) => (
                            <View key={tx._id} style={[styles.transactionItem, { backgroundColor: theme.colors.card }]}>
                                <View style={[styles.txIcon, { backgroundColor: tx.transaction_type === 'deposit' ? '#DCFCE7' : '#FEF2F2' }]}>
                                    <Ionicons
                                        name={tx.transaction_type === 'deposit' ? 'arrow-down' : 'arrow-up'}
                                        size={20}
                                        color={tx.transaction_type === 'deposit' ? '#22C55E' : '#EF4444'}
                                    />
                                </View>
                                <View style={styles.txDetails}>
                                    <Text style={[styles.txTitle, { color: theme.colors.text }]}>
                                        {tx.transaction_type === 'deposit'
                                            ? (tx.status === 'completed' ? 'Money Added' : 'Deposit Request')
                                            : 'Withdrawal Request'}
                                    </Text>
                                    <Text style={[styles.txDate, { color: theme.colors.muted }]}>
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.txAmount, { color: tx.transaction_type === 'deposit' ? '#22C55E' : theme.colors.text }]}>
                                        {tx.transaction_type === 'deposit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                    </Text>
                                    <Text style={[styles.txStatus, { color: getStatusColor(tx.status) }]}>
                                        {tx.status}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color={theme.colors.muted} />
                            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>No transactions yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Toast />

            {/* Add Money Modal */}
            <Modal
                visible={isAddModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <Pressable style={styles.modalDismiss} onPress={() => setIsAddModalVisible(false)} />
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Money</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Amount Input */}
                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Amount (₹)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, fontSize: 20, fontWeight: '700' }]}
                                placeholder="0"
                                placeholderTextColor={theme.colors.muted}
                                keyboardType="numeric"
                                value={addMoneyAmount}
                                onChangeText={setAddMoneyAmount}
                            />

                            <View style={styles.quickAmounts}>
                                {[100, 500, 1000, 2000].map((amt) => (
                                    <TouchableOpacity
                                        key={amt}
                                        style={[styles.quickAmountButton, { backgroundColor: theme.colors.background }]}
                                        onPress={() => setAddMoneyAmount(amt.toString())}
                                    >
                                        <Text style={[styles.quickAmountText, { color: theme.colors.text }]}>₹{amt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Remarks (Optional)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="e.g. UPI Ref"
                                placeholderTextColor={theme.colors.muted}
                                value={addMoneyRemarks}
                                onChangeText={setAddMoneyRemarks}
                            />

                            {/* Payment Instructions */}
                            <View style={[styles.paymentInstructionContainer, { backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: theme.colors.primary }]}>
                                <Text style={[styles.instructionTitle, { color: theme.colors.primary }]}>Payment Instructions</Text>
                                <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                                    1. Pay ₹{addMoneyAmount || '0'} to UPI ID:
                                </Text>
                                <View style={[styles.upiIdContainer, { backgroundColor: theme.colors.background }]}>
                                    <Text style={[styles.upiIdText, { color: theme.colors.text }]}>{upiId}</Text>
                                    <TouchableOpacity onPress={() => addMoneyToastRef.current?.show({ type: 'success', text1: 'Copied', text2: 'UPI ID copied to clipboard' })}>
                                        <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.instructionText, { color: theme.colors.text, marginTop: 8 }]}>
                                    2. Upload Payment Proof below:
                                </Text>
                            </View>

                            {/* Custom Upload Button */}
                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Payment Screenshot</Text>
                            <TouchableOpacity
                                style={[styles.uploadButton, { borderColor: theme.colors.primary }]}
                                onPress={pickImage}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator color={theme.colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
                                        <Text style={[styles.uploadButtonText, { color: theme.colors.primary }]}>
                                            {paymentProofUrl ? "Change Screenshot" : "Click to Upload Screenshot"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {paymentProofUrl && (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: paymentProofUrl }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.removePreview}
                                        onPress={() => setPaymentProofUrl('')}
                                    >
                                        <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
                                onPress={handleAddMoney}
                                disabled={isAddingMoney}
                            >
                                {isAddingMoney ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Request</Text>
                                )}
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                    <Toast ref={addMoneyToastRef} config={toastConfig} />
                </KeyboardAvoidingView>
            </Modal>

            {/* Withdrawal Modal */}
            <Modal
                visible={isWithdrawModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsWithdrawModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <Pressable style={styles.modalDismiss} onPress={() => setIsWithdrawModalVisible(false)} />
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Withdraw/Transfer</Text>
                                <TouchableOpacity onPress={() => setIsWithdrawModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.colors.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Withdrawal Amount (₹)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="Enter amount"
                                placeholderTextColor={theme.colors.muted}
                                keyboardType="numeric"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                            />

                            <View style={styles.divider} />
                            <Text style={styles.sectionSubTitle}>Bank Details</Text>

                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>Account Holder Name</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="Name as per bank"
                                placeholderTextColor={theme.colors.muted}
                                value={bankDetails.account_holder_name}
                                onChangeText={(val) => setBankDetails({ ...bankDetails, account_holder_name: val })}
                            />

                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>Account Number</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="Account Number"
                                placeholderTextColor={theme.colors.muted}
                                keyboardType="numeric"
                                value={bankDetails.account_number}
                                onChangeText={(val) => setBankDetails({ ...bankDetails, account_number: val })}
                            />

                            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>IFSC Code</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="IFSC Code"
                                placeholderTextColor={theme.colors.muted}
                                autoCapitalize="characters"
                                value={bankDetails.ifsc_code}
                                onChangeText={(val) => setBankDetails({ ...bankDetails, ifsc_code: val })}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
                                onPress={handleWithdrawal}
                                disabled={isWithdrawing}
                            >
                                {isWithdrawing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Request Withdrawal</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                    <Toast ref={withdrawToastRef} config={toastConfig} />
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    balanceCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 24,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    transactionItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    txDetails: {
        flex: 1,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 12,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    txStatus: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalDismiss: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    quickAmounts: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    quickAmountButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: '600',
    },
    paymentInstructionContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    instructionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 13,
        lineHeight: 18,
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
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    sectionSubTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginBottom: 16,
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    previewContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    removePreview: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
});
