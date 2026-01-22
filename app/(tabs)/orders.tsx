import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../_theme/ThemeProvider';
import {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  Order,
} from '../../src/redux/api/orderApi';

type OrderStatus = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function Orders() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const { data: ordersData, isLoading, isError, refetch, isFetching } = useGetOrdersQuery({
    page: 1,
    limit: 50,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const { data: orderDetailData } = useGetOrderByIdQuery(selectedOrderId || '', {
    skip: !selectedOrderId,
  });

  const orders = ordersData?.data?.orders || [];
  const selectedOrder = orderDetailData?.data?.order;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#10B981';
      case 'confirmed':
      case 'processing':
        return '#3B82F6';
      case 'shipped':
        return '#8B5CF6';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return theme.colors.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'confirmed':
        return 'checkmark';
      case 'processing':
        return 'time';
      case 'shipped':
        return 'car';
      case 'pending':
        return 'hourglass';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'ellipse';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOrderPress = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderModal(true);
  };

  const statusFilters: { label: string; value: OrderStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
  ];

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => handleOrderPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <View style={[styles.orderIcon, { backgroundColor: getStatusColor(item.order_status) + '20' }]}>
            <Ionicons name={getStatusIcon(item.order_status) as any} size={20} color={getStatusColor(item.order_status)} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.text }]}>#{item.order_number}</Text>
            <Text style={[styles.orderDate, { color: theme.colors.muted }]}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.order_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.order_status) }]}>
            {item.order_status.charAt(0).toUpperCase() + item.order_status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 3).map((orderItem, index) => (
          <View key={index} style={styles.orderItemRow}>
            <Image
              source={{ uri: orderItem.product_image || 'https://picsum.photos/200/200' }}
              style={styles.orderItemImage}
              defaultSource={{ uri: 'https://via.placeholder.com/200' }}
            />
            <View style={styles.orderItemDetails}>
              <Text style={[styles.orderItemName, { color: theme.colors.text }]} numberOfLines={1}>
                {orderItem.product_name}
              </Text>
              <Text style={[styles.orderItemMeta, { color: theme.colors.muted }]}>
                Qty: {orderItem.quantity} × ₹{orderItem.product_price.toFixed(0)}
              </Text>
            </View>
            <Text style={[styles.orderItemPrice, { color: theme.colors.text }]}>
              ₹{orderItem.total_price.toFixed(0)}
            </Text>
          </View>
        ))}
        {item.items.length > 3 && (
          <Text style={[styles.moreItems, { color: theme.colors.primary }]}>
            +{item.items.length - 3} more item{item.items.length - 3 > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={[styles.orderFooter, { borderTopColor: theme.colors.border }]}>
        <View style={styles.orderFooterLeft}>
          <Text style={[styles.orderFooterLabel, { color: theme.colors.muted }]}>Total Amount</Text>
          <Text style={[styles.orderTotal, { color: theme.colors.text }]}>₹{item.total_amount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.viewDetailsButton, { backgroundColor: theme.colors.primary + '15' }]}
          onPress={() => handleOrderPress(item.id)}
        >
          <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error || '#EF4444'} />
          <Text style={[styles.errorText, { color: theme.colors.error || '#EF4444' }]}>
            Failed to load orders
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedStatus === filter.value ? theme.colors.primary : theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedStatus(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedStatus === filter.value ? '#fff' : theme.colors.text,
                  fontWeight: selectedStatus === filter.value ? '600' : '500',
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={theme.colors.muted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No orders found</Text>
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            {selectedStatus === 'all'
              ? "You haven't placed any orders yet. Start shopping!"
              : `No ${selectedStatus} orders found.`}
          </Text>
          {selectedStatus !== 'all' && (
            <TouchableOpacity
              style={[styles.clearFilterButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setSelectedStatus('all')}
            >
              <Text style={styles.clearFilterText}>View All Orders</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Order Details Modal */}
      <Modal visible={showOrderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Order Number</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>#{selectedOrder.order_number}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Order Date</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(selectedOrder.createdAt)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Order Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.order_status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.order_status) }]}>
                        {selectedOrder.order_status.charAt(0).toUpperCase() + selectedOrder.order_status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Payment Status</Text>
                    <Text style={[styles.detailValue, { color: selectedOrder.payment_status === 'completed' ? '#10B981' : theme.colors.text }]}>
                      {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Order Items */}
                <View style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: theme.colors.text }]}>Order Items</Text>
                  {selectedOrder.items.map((orderItem, index) => (
                    <View key={index} style={[styles.detailOrderItem, { borderBottomColor: theme.colors.border }]}>
                      <Image
                        source={{ uri: orderItem.product_image || 'https://picsum.photos/200/200' }}
                        style={styles.detailItemImage}
                        defaultSource={{ uri: 'https://via.placeholder.com/200' }}
                      />
                      <View style={styles.detailItemInfo}>
                        <Text style={[styles.detailItemName, { color: theme.colors.text }]}>{orderItem.product_name}</Text>
                        <Text style={[styles.detailItemMeta, { color: theme.colors.muted }]}>
                          {orderItem.category && `${orderItem.category} • `}Qty: {orderItem.quantity}
                        </Text>
                        <Text style={[styles.detailItemPrice, { color: theme.colors.text }]}>
                          ₹{orderItem.product_price.toFixed(0)} × {orderItem.quantity} = ₹{orderItem.total_price.toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Delivery Address */}
                <View style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: theme.colors.text }]}>Delivery Address</Text>
                  <Text style={[styles.addressText, { color: theme.colors.text }]}>
                    {selectedOrder.delivery_address.address}
                  </Text>
                  <Text style={[styles.addressText, { color: theme.colors.text }]}>
                    {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} - {selectedOrder.delivery_address.pincode}
                  </Text>
                  <Text style={[styles.addressText, { color: theme.colors.text }]}>
                    {selectedOrder.delivery_address.country}
                  </Text>
                </View>

                {/* Order Total */}
                <View style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total Amount</Text>
                    <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                      ₹{selectedOrder.total_amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowOrderModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
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
  filtersContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
  clearFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  orderItemMeta: {
    fontSize: 12,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreItems: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  orderFooterLeft: {
    flex: 1,
  },
  orderFooterLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailOrderItem: {
    flexDirection: 'row',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  detailItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  detailItemInfo: {
    flex: 1,
  },
  detailItemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailItemMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
});

