import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Button, FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Store() {
  const [query, setQuery] = useState('');

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

  const items = [1, 2, 3, 4, 5, 6];
  const filtered = items.filter((i) => `${i}`.includes(query) || query.trim() === '');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <SearchInput value={query} onChange={(t) => setQuery(t)} placeholder="Search for products..." />
      <Text style={styles.sectionTitle}>Featured Products</Text>
      <FlatList
        data={filtered}
        keyExtractor={(i) => `${i}`}
        numColumns={2}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={{ uri: `https://picsum.photos/200/200?random=${item}` }} style={styles.cardImage} />
              <Text style={styles.cardTitle}>Desi Ghee {item}</Text>
              <Text style={styles.cardDescription}>Some quick description</Text>
              <Button title="Buy Now" onPress={() => alert(`Buying item ${item}`)} />
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: 10,
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
  sectionTitle: {

    color: '#1d3581ff',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
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
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
