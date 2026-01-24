import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../_theme/ThemeProvider';
import { useGetCartQuery } from '../../../src/redux/api/cartApi';

export default function StoreHeader() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: cartData } = useGetCartQuery();
  const cartItemCount = cartData?.count || 0;

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Store</Text>
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/cart')}
        style={styles.cartButton}
      >
        <Ionicons name="cart" size={24} color="#fff" />
        {cartItemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

