import React, { useState, useMemo, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../_theme/ThemeProvider';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetSubscriptionQuery,
  useCreateOrUpdateSubscriptionMutation,
} from '../../src/redux/api/subscriptionApi';
import {
  useGetSubscriptionProductsQuery,
} from '../../src/redux/api/subscriptionProductApi';

// Keep these as constants since they're UI options, not from DB

const DELIVERY_TIMES = [
  { label: 'Morning (6-8 AM)', value: 'morning', icon: 'sunny' },
  { label: 'Evening (6-8 PM)', value: 'evening', icon: 'moon' },
];

const FREQUENCY_OPTIONS = [
  { label: 'Daily', subtitle: 'Every day', value: 'daily', deliveriesPerMonth: 30 },
  { label: 'Weekdays', subtitle: 'Mon-Fri', value: 'weekdays', deliveriesPerMonth: 22 },
  { label: 'Weekly', subtitle: '1x per week', value: 'weekly', deliveriesPerMonth: 4 },
  { label: 'Bi-weekly', subtitle: 'Every 2 weeks', value: 'biweekly', deliveriesPerMonth: 2 },
];

// Helper function to create a light tint of a color
const lightenColor = (color, opacity = 0.1) => {
  // For hex colors, convert to rgba with opacity
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Helper function to darken a color for ripple effect
const darkenColor = (color) => {
  if (color.startsWith('#')) {
    const r = Math.max(0, parseInt(color.slice(1, 3), 16) - 20);
    const g = Math.max(0, parseInt(color.slice(3, 5), 16) - 20);
    const b = Math.max(0, parseInt(color.slice(5, 7), 16) - 20);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return color;
};

export default function Subscription() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Fetch subscription products from API
  const { data: productsData, isLoading: isLoadingProducts } = useGetSubscriptionProductsQuery();
  // Fetch existing subscription
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetSubscriptionQuery();
  const [createOrUpdateSubscription, { isLoading: isSaving }] = useCreateOrUpdateSubscriptionMutation();

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedTime, setSelectedTime] = useState('morning');
  const [selectedFrequency, setSelectedFrequency] = useState('daily');

  // Get products array
  const products = productsData?.products || [];

  // Load existing subscription data when available
  useEffect(() => {
    if (subscriptionData?.subscription) {
      const sub = subscriptionData.subscription;
      setSelectedProductId(sub.subscription_product.id);
      setSelectedTime(sub.delivery_time);
      setSelectedFrequency(sub.frequency);
    } else if (products.length > 0 && !selectedProductId) {
      // Set default to first product if no subscription exists
      setSelectedProductId(products[0].id);
    }
  }, [subscriptionData, products]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedFreqOption = FREQUENCY_OPTIONS.find(opt => opt.value === selectedFrequency);

  const monthlyEstimate = useMemo(() => {
    if (!selectedProduct || !selectedFreqOption) return 0;
    return selectedProduct.price_per_delivery * selectedFreqOption.deliveriesPerMonth;
  }, [selectedProduct, selectedFreqOption]);

  // Create light tint of primary color for selected backgrounds
  const selectedBgColor = lightenColor(theme.colors.primary, 0.15);

  // Handle checkout/save subscription
  const handleCheckout = async () => {
    if (!selectedProductId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a milk quantity',
      });
      return;
    }

    try {
      const result = await createOrUpdateSubscription({
        subscription_product_id: selectedProductId,
        delivery_time: selectedTime,
        frequency: selectedFrequency,
      }).unwrap();

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: subscriptionData?.subscription
            ? 'Subscription updated successfully!'
            : 'Subscription created successfully!',
        });
      }
    } catch (err) {
      let errorMessage = 'Failed to save subscription. Please try again.';

      if (err && typeof err === 'object') {
        if ('data' in err && err.data && typeof err.data === 'object' && 'message' in err.data) {
          errorMessage = err.data.message;
        } else if ('message' in err) {
          errorMessage = err.message;
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header - matching store header style */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={() => Toast.show({
          type: 'info',
          text1: 'Subscription Info',
          text2: 'Choose your daily milk quantity and delivery schedule.'
        })}>
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {(isLoadingSubscription || isLoadingProducts) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Loading...
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            No subscription products available
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Milk Quantity Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              How much milk do you need?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
              Select your daily quantity
            </Text>

            <View style={styles.quantityGrid}>
              {products && products.length > 0 && products.map((product, index) => {
                const isSelected = selectedProductId === product.id;
                // Use quantity as key since it's unique, fallback to index if needed
                const uniqueKey = product.quantity || `product-${index}`;
                return (
                  <TouchableOpacity
                    key={uniqueKey}
                    style={[
                      styles.quantityCard,
                      isSelected && styles.quantityCardSelected,
                      {
                        backgroundColor: isSelected ? selectedBgColor : theme.colors.card,
                        borderColor: isSelected ? theme.colors.primary : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setSelectedProductId(product.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quantityText,
                        {
                          color: isSelected ? theme.colors.primary : theme.colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {product.quantity}
                    </Text>
                    <Text
                      style={[
                        styles.quantityPrice,
                        {
                          color: isSelected ? theme.colors.primary : theme.colors.text,
                        },
                      ]}
                    >
                      ₹{product.price_per_delivery.toFixed(0)}/day
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Delivery Time Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Preferred delivery time?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
              Choose when you want your milk
            </Text>

            <View style={styles.optionsList}>
              {DELIVERY_TIMES.map((time) => {
                const isSelected = selectedTime === time.value;
                return (
                  <TouchableOpacity
                    key={time.value}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      {
                        backgroundColor: isSelected ? selectedBgColor : theme.colors.card,
                        borderColor: isSelected ? theme.colors.primary : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setSelectedTime(time.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.radioButton,
                          {
                            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                            borderColor: isSelected ? theme.colors.primary : '#BDBDBD',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <Ionicons
                        name={time.icon}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.muted}
                        style={styles.optionIcon}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? theme.colors.text : theme.colors.text,
                            fontWeight: isSelected ? '600' : '500',
                          },
                        ]}
                      >
                        {time.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Frequency Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              How often?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
              Choose your delivery frequency
            </Text>

            <View style={styles.optionsList}>
              {FREQUENCY_OPTIONS.map((freq) => {
                const isSelected = selectedFrequency === freq.value;
                return (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      {
                        backgroundColor: isSelected ? selectedBgColor : theme.colors.card,
                        borderColor: isSelected ? theme.colors.primary : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setSelectedFrequency(freq.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.radioButton,
                          {
                            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                            borderColor: isSelected ? theme.colors.primary : '#BDBDBD',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.frequencyTextContainer}>
                        <Text
                          style={[
                            styles.optionLabel,
                            {
                              color: isSelected ? theme.colors.text : theme.colors.text,
                              fontWeight: isSelected ? '600' : '500',
                            },
                          ]}
                        >
                          {freq.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionSubtitle,
                            { color: theme.colors.muted },
                          ]}
                        >
                          {freq.subtitle}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>
                Price per delivery:
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                ₹{selectedProduct?.price_per_delivery.toFixed(0) || '0'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>
                Deliveries per month:
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {selectedFreqOption?.deliveriesPerMonth || 0}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.summaryLabelBold, { color: theme.colors.text }]}>
                Monthly estimate:
              </Text>
              <Text style={[styles.summaryValue, styles.summaryValueBold, { color: theme.colors.primary }]}>
                ₹{monthlyEstimate.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Checkout Button */}
          <Pressable
            style={[
              styles.checkoutButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: isSaving ? 0.7 : 1,
              }
            ]}
            onPress={handleCheckout}
            disabled={isSaving}
            android_ripple={{ color: darkenColor(theme.colors.primary) }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#fff" style={styles.checkoutIcon} />
                <Text style={styles.checkoutButtonText}>
                  {subscriptionData?.subscription ? 'Update Subscription' : 'Proceed to Checkout'}
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  quantityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quantityCard: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityCardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quantityText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  quantityPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 4,
  },
  frequencyTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryLabelBold: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryValueBold: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutIcon: {
    marginRight: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
