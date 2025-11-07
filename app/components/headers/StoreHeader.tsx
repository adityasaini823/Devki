import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../_theme/ThemeProvider';

export default function StoreHeader() {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      <Text style={styles.headerTitle}>Store</Text>
      <TouchableOpacity onPress={() => alert('Cart pressed')}>
        <Ionicons name="cart" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

