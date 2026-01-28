import React, { useEffect, useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { tokenStorage } from "../../src/utils/tokenStorage";
import { useTheme } from "../_theme/ThemeProvider";
import { useGetProductsQuery } from "../../src/redux/api/productApi";
import { useGetSubscriptionQuery } from "../../src/redux/api/subscriptionApi";
import { useAddOrUpdateCartItemMutation } from "../../src/redux/api/cartApi";
import { useGetWalletBalanceQuery } from "../../src/redux/api/walletApi";

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Fetch data
  const { data: productsData, isLoading: isLoadingProducts, refetch: refetchProducts } = useGetProductsQuery();
  const { data: subscriptionData, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useGetSubscriptionQuery();
  const { data: balanceData, refetch: refetchWallet } = useGetWalletBalanceQuery();
  const [addOrUpdateCartItem] = useAddOrUpdateCartItemMutation();

  const products = productsData?.products || [];
  const featuredProducts = products.slice(0, 4); // Show first 4 products
  const subscription = subscriptionData?.subscription;
  const balance = balanceData?.balance || 0;

  useFocusEffect(
    useCallback(() => {
      refetchProducts();
      refetchSubscription();
      refetchWallet();
    }, [])
  );

  useEffect(() => {
    const getUser = async () => {
      const user = await tokenStorage.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchSubscription(), refetchWallet()]);
    setRefreshing(false);
  };
  // ... (keep existing handler functions)

  const handleAddToCart = async (productId: string, productName: string) => {
    setAddingProductId(productId);
    try {
      await addOrUpdateCartItem({ product_id: productId, quantity: 1 }).unwrap();
      alert(`Added ${productName} to cart!`);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || "Failed to add item to cart. Please try again.";
      alert(errorMessage);
    } finally {
      setAddingProductId(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: { [key: string]: string } = {
      daily: "Daily",
      weekdays: "Weekdays",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
    };
    return labels[frequency] || frequency;
  };

  const getDeliveryTimeLabel = (time: string) => {
    return time === "morning" ? "Morning (6-8 AM)" : "Evening (6-8 PM)";
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <LinearGradient
          colors={[theme.colors.primary, lightenColor(theme.colors.primary, 0.8)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroGreeting}>Hello, {user?.first_name || "Milk Mate"}!</Text>

              <View style={{ marginVertical: 12 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Wallet Balance</Text>
                <Text style={{ fontSize: 32, color: '#fff', fontWeight: '800' }}>₹{balance.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={styles.heroCTA}
                onPress={() => router.push("/(tabs)/wallet")}
              >
                <Text style={[styles.heroCTAText, { color: theme.colors.primary }]}>Top Up</Text>
                <Ionicons name="wallet" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroIconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="water" size={60} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </View>

          {/* Abstract Shapes for Texture */}
          <View style={[styles.abstractShape, styles.shape1]} />
          <View style={[styles.abstractShape, styles.shape2]} />
        </LinearGradient>
      </View>

      {/* Quick Navigation Cards */}
      <View style={styles.quickNavContainer}>
        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: theme.colors.card }]}
          onPress={() => router.push("/(tabs)/subscription")}
          activeOpacity={0.7}
        >
          <View style={[styles.quickNavIconContainer, { backgroundColor: lightenColor(theme.colors.primary, 0.2) }]}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Subscribe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: theme.colors.card }]}
          onPress={() => router.push("/(tabs)/store")}
          activeOpacity={0.7}
        >
          <View style={[styles.quickNavIconContainer, { backgroundColor: lightenColor(theme.colors.primary, 0.2) }]}>
            <Ionicons name="storefront" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Store</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: theme.colors.card }]}
          onPress={() => router.push("/(tabs)/orders")}
          activeOpacity={0.7}
        >
          <View style={[styles.quickNavIconContainer, { backgroundColor: lightenColor(theme.colors.primary, 0.2) }]}>
            <Ionicons name="receipt" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: theme.colors.card }]}
          onPress={() => alert('Support feature coming soon!')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickNavIconContainer, { backgroundColor: lightenColor(theme.colors.primary, 0.2) }]}>
            <Ionicons name="headset" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.quickNavTitle, { color: theme.colors.text }]}>Support</Text>
        </TouchableOpacity>
      </View>

      {/* Current Subscription Section */}
      {isLoadingSubscription ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : subscription ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current Subscription</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/subscription")}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.subscriptionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push("/(tabs)/subscription")}
            activeOpacity={0.8}
          >
            <View style={styles.subscriptionContent}>
              <View style={[styles.subscriptionIconContainer, { backgroundColor: lightenColor(theme.colors.primary, 0.15) }]}>
                <Ionicons name="water" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.subscriptionDetails}>
                <Text style={[styles.subscriptionQuantity, { color: theme.colors.text }]}>
                  {subscription.subscription_product.quantity}
                </Text>
                <Text style={[styles.subscriptionFrequency, { color: theme.colors.muted }]}>
                  {getFrequencyLabel(subscription.frequency)} • {getDeliveryTimeLabel(subscription.delivery_time)}
                </Text>
                <View style={styles.subscriptionPriceRow}>
                  <Text style={[styles.subscriptionPrice, { color: theme.colors.text }]}>
                    ₹{subscription.monthly_estimate}/month
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: subscription.status === "active" ? "#10B981" : "#F59E0B" }]}>
                    <Text style={styles.statusText}>{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.muted} />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Start Your Subscription</Text>
          </View>
          <TouchableOpacity
            style={[styles.subscriptionCard, styles.noSubscriptionCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push("/(tabs)/subscription")}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={[styles.noSubscriptionText, { color: theme.colors.text }]}>Create a subscription plan</Text>
            <Text style={[styles.noSubscriptionSubtext, { color: theme.colors.muted }]}>
              Get fresh milk delivered to your doorstep
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Featured Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Featured Products</Text>
          {products.length > 4 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/store")}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoadingProducts ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : featuredProducts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {featuredProducts.map((product) => (
              <View key={product.id} style={styles.productCardWrapper}>
                <Pressable
                  style={[styles.productCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => router.push("/(tabs)/store")}
                >
                  <Image
                    source={{ uri: product.product_image || "https://picsum.photos/200/200" }}
                    style={styles.productImage}
                  />
                  <Text style={[styles.productTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {product.product_name}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.colors.text }]}>₹{product.product_price.toFixed(0)}</Text>
                  <Pressable
                    style={[
                      styles.addToCartButton,
                      {
                        backgroundColor: product.product_stock > 0 ? theme.colors.primary : "#D1D5DB",
                        opacity: product.product_stock > 0 ? (addingProductId === product.id ? 0.7 : 1) : 0.6,
                      },
                    ]}
                    onPress={() => handleAddToCart(product.id, product.product_name)}
                    disabled={product.product_stock === 0 || addingProductId === product.id}
                  >
                    {addingProductId === product.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.addToCartText}>
                        {product.product_stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </Text>
                    )}
                  </Pressable>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>No products available</Text>
          </View>
        )}
      </View>

      {/* Quick Stats Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Stats</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {subscription ? subscription.deliveries_per_month : 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Deliveries/Month</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="basket" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{products.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Products Available</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Helper function to create a light tint of a color
const lightenColor = (color: string, opacity = 0.1) => {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
    minHeight: 180,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 20,
    lineHeight: 20,
  },
  heroCTA: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  heroCTAText: {
    fontWeight: "700",
    fontSize: 14,
  },
  heroIconContainer: {
    marginLeft: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  abstractShape: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
  },
  shape1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  shape2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -75,
  },
  quickNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8, // Reduced gap
  },
  quickNavCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12, // Reduced vertical padding
    paddingHorizontal: 4, // Minimal horizontal padding
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickNavIconContainer: {
    width: 44, // Slightly smaller
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickNavTitle: {
    fontSize: 11, // Reduced font size to prevent wrapping
    fontWeight: "700",
    marginBottom: 0,
    textAlign: "center",
  },
  quickNavSubtitle: {
    display: 'none', // Hide subtitles to save space and clean up UI as per design
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingSection: {
    paddingVertical: 20,
    alignItems: "center",
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  subscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  subscriptionDetails: {
    flex: 1,
  },
  subscriptionQuantity: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subscriptionFrequency: {
    fontSize: 13,
    marginBottom: 8,
  },
  subscriptionPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subscriptionPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  noSubscriptionCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  noSubscriptionText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  noSubscriptionSubtext: {
    fontSize: 13,
    textAlign: "center",
  },
  productsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  productCardWrapper: {
    width: 160,
    marginRight: 12,
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  addToCartButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
