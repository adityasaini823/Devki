import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../_theme/ThemeProvider';
export default function StoreHeader() {
  const { theme } = useTheme();

  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (t: string) => void; placeholder?: string }) => (
    <View style={styles.searchWrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder ?? 'Search...'}
          value={value}
          onChangeText={onChange}
          underlineColorAndroid="transparent"
          placeholderTextColor="#666"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} testID="clear-search">
            <Ionicons name="close" size={18} color="#666" style={{ marginRight: 10 }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  const androidPadding = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: androidPadding }]}>
        <View style={styles.left}>
          <TouchableOpacity onPress={() => { /* TODO: navigate back */ }} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#222" />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Text style={styles.title}>Dairy Store</Text>
          <Text style={styles.subtitle}>Fresh Dairy Products </Text>
        </View>

        <View style={styles.right}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { /* TODO: open search */ }}>
            <Ionicons name="search" size={20} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartWrapper} onPress={() => { /* TODO: open cart */ }}>
            <Ionicons name="cart-outline" size={22} color="#222" />
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  searchWrapper: {
    width: '95%',
    alignSelf: 'center',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 44,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    color: '#000',
    height: '100%',
  },
  left: { width: 48, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'flex-start' },
  right: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 12, color: '#666' },
  iconBtn: { padding: 8 },
  cartWrapper: { padding: 8, marginLeft: 8 },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
