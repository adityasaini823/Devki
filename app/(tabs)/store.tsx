import React from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../_theme/ThemeProvider';
import { useGetProductsQuery } from '../../src/redux/api/productApi';
import { useAddOrUpdateCartItemMutation } from '../../src/redux/api/cartApi';

export default function Store() {
  const { theme } = useTheme();
  const { data: productsData, isLoading, isError, refetch, isFetching } = useGetProductsQuery();
  const [addOrUpdateCartItem, { isLoading: isAdding }] = useAddOrUpdateCartItemMutation();

  const products = productsData?.products || [];

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      await addOrUpdateCartItem({ product_id: productId, quantity: 1 }).unwrap();
      alert(`Added ${productName} to cart!`);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || 'Failed to add item to cart. Please try again.';
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Loading products...
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (isError) {
    return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error || '#EF4444' }]}>
            Failed to load products
          </Text>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Featured Products {products.length > 0 && `(${products.length})`}
      </Text>
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            No products available
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.scrollContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: theme.colors.card }]} 
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: item.product_image || 'https://picsum.photos/200/200' }} 
                  style={styles.cardImage}
                  defaultSource={{ uri: 'https://via.placeholder.com/200' }}
                />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.product_name}
                </Text>
                {item.description && (
                  <Text style={[styles.cardDescription, { color: theme.colors.muted }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: theme.colors.text }]}>
                    ₹{item.product_price.toFixed(0)}
                  </Text>
                  {item.product_stock > 0 ? (
                    <Text style={[styles.stockText, { color: theme.colors.muted }]}>
                      In Stock
                    </Text>
                  ) : (
                    <Text style={[styles.stockText, { color: theme.colors.error || '#EF4444' }]}>
                      Out of Stock
                    </Text>
                  )}
                </View>
                <Pressable 
                  style={[
                    styles.cartButton, 
                    { 
                      backgroundColor: item.product_stock > 0 ? theme.colors.primary : '#D1D5DB',
                      opacity: item.product_stock > 0 ? (isAdding ? 0.7 : 1) : 0.6,
                    }
                  ]} 
                  onPress={() => handleAddToCart(item.id, item.product_name)}
                  disabled={item.product_stock === 0 || isAdding}
                >
                  <Text style={styles.cartButtonText}>
                    {item.product_stock === 0
                      ? 'Out of Stock'
                      : isAdding
                      ? 'Adding...'
                      : 'Add To Cart'}
                  </Text>
                </Pressable>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
    marginBottom: 10,
  },

  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  cardWrapper: {
    flexBasis: '45%',
    maxWidth: '45%',
    margin: 10,
  },
  card: {
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    // alignItems: 'center',
    alignSelf: 'stretch',
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 11,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    padding: 4
  },
  cartButton: {
    color:"white",
    padding:10,
    borderRadius: 15,
    width:"100%",
    marginTop: 10
  },
  cartButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
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
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
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
  },
  emptyText: {
    fontSize: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
