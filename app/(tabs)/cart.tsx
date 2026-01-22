import React, { useState, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../_theme/ThemeProvider';
import {
  useGetCartQuery,
  useUpdateCartItemQuantityMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  CartItem,
} from '../../src/redux/api/cartApi';
import { useCheckoutMutation } from '../../src/redux/api/orderApi';
import { useGetWalletBalanceQuery } from '../../src/redux/api/walletApi';

export default function Cart() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cartData, isLoading, isError, refetch, isFetching } = useGetCartQuery();
  const [updateQuantity, { isLoading: isUpdating }] = useUpdateCartItemQuantityMutation();
  const [removeItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();
  const [checkout, { isLoading: isCheckingOut }] = useCheckoutMutation();
  const { data: walletData, refetch: refetchWallet } = useGetWalletBalanceQuery();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchWallet();
    }, [])
  );

  const cartItems = cartData?.items || [];
  const cartTotal = cartData?.cartTotal || 0;
  const itemCount = cartData?.count || 0;
  const walletBalance = walletData?.balance || 0;

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      // Remove item if quantity becomes 0
      handleRemoveItem(itemId);
      return;
    }

    try {
      await updateQuantity({ id: itemId, quantity: newQuantity }).unwrap();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.data?.message || error?.message || 'Failed to update quantity.',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(itemId).unwrap();
              Toast.show({
                 type: 'success',
                 text1: 'Item Removed',
                 text2: 'Item has been removed from your cart.',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.data?.message || 'Failed to remove item.',
              });
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart().unwrap();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.data?.message || error?.message || 'Failed to clear cart. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Empty Cart',
        text2: 'Your cart is empty. Add some items to proceed.',
      });
      return;
    }

    // Check wallet balance
    if (walletBalance < cartTotal) {
      const shortfall = cartTotal - walletBalance;
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance is ₹${walletBalance.toFixed(2)}. You need ₹${shortfall.toFixed(2)} more to complete this purchase.\n\nWould you like to add money to your wallet?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Money',
            onPress: () => router.push('/(tabs)/wallet'),
          },
        ]
      );
      return;
    }

    // Confirm checkout
    Alert.alert(
      'Confirm Checkout',
      `Total Amount: ₹${cartTotal.toFixed(2)}\nWallet Balance: ₹${walletBalance.toFixed(2)}\n\nProceed with checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const result = await checkout().unwrap();
              Toast.show({
                type: 'success',
                text1: 'Order Placed!',
                text2: `Order #${result.data.order.order_number} confirmed.`,
              });
              refetchWallet();
              router.push('/(tabs)/store');
            } catch (error: any) {
              const errorMessage =
                error?.data?.message ||
                error?.message ||
                'Failed to complete checkout. Please try again.';
              
              if (error?.data?.shortfall) {
                Alert.alert(
                  'Insufficient Balance',
                  `${errorMessage}\n\nShortfall: ₹${error.data.shortfall.toFixed(2)}\nWould you like to add money to your wallet?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Add Money',
                      onPress: () => router.push('/(tabs)/wallet'),
                    },
                  ]
                );
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Checkout Failed',
                  text2: errorMessage,
                });
              }
            }
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Image
        source={{ uri: item.product_image || 'https://picsum.photos/200/200' }}
        style={styles.itemImage}
        defaultSource={{ uri: 'https://via.placeholder.com/200' }}
      />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text style={[styles.itemPrice, { color: theme.colors.textSecondary }]}>
          ₹{item.product_price.toFixed(0)} each
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
            disabled={isUpdating || isRemoving}
          >
            <Ionicons name="remove" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: theme.colors.textPrimary }]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
            disabled={isUpdating || isRemoving}
          >
            <Ionicons name="add" size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemTotal, { color: theme.colors.textPrimary }]}>
          ₹{item.total_price.toFixed(0)}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
          disabled={isRemoving}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error || '#EF4444'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="cart-outline" size={64} color={theme.colors.muted} />
          <Text style={[styles.errorText, { color: theme.colors.error || '#EF4444' }]}>
            Failed to load cart
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.customHeader, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/store')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Cart</Text>
          {itemCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.headerClearButton}
            onPress={handleClearCart}
            disabled={isClearing}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={theme.colors.muted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            Add some products to get started!
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={theme.colors.primary}
              />
            }
            ListFooterComponent={
              <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
                    ₹{cartTotal.toFixed(0)}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.totalLabel, { color: theme.colors.textPrimary }]}>
                    Total
                  </Text>
                  <Text style={[styles.summaryValue, styles.totalValue, { color: theme.colors.primary }]}>
                    ₹{cartTotal.toFixed(0)}
                  </Text>
                </View>
              </View>
            }
          />

          <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
            <View style={styles.footerTotal}>
              <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Total</Text>
              <Text style={[styles.footerAmount, { color: theme.colors.textPrimary }]}>
                ₹{cartTotal.toFixed(0)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                { backgroundColor: theme.colors.primary },
                (cartItems.length === 0 || isCheckingOut) && styles.disabledButton,
              ]}
              onPress={handleCheckout}
              disabled={cartItems.length === 0 || isCheckingOut}
            >
              {isCheckingOut ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              )}
            </TouchableOpacity>
            {walletBalance < cartTotal && cartItems.length > 0 && (
              <Text style={[styles.walletWarning, { color: theme.colors.error || '#EF4444' }]}>
                Insufficient wallet balance. Add ₹{(cartTotal - walletBalance).toFixed(2)} more.
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerClearButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 16,
  },
  footerAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  walletWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

