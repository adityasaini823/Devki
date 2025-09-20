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
  View
} from 'react-native';
import { useTheme } from '../_theme/ThemeProvider';

export default function Store() {
  const items = [1, 2, 3, 4, 5, 6];

  const { theme } = useTheme();

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text, }]}>Featured Products</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => `${i}`}
        numColumns={2}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={{ uri: `https://picsum.photos/200/200?random=${item}` }} style={styles.cardImage} />
              <Text style={styles.cardTitle}>Desi Ghee {item}</Text>
              <Text style={styles.cardDescription}>Home Made Ghee - 500ml</Text>
              <View>
                <Text style={styles.price}>₹ 500</Text>
              </View>
              <Pressable style={[styles.cartButton, { backgroundColor: theme.colors.primary }]} onPress={() => alert(`Buying item ${item}`)}>
                <Text style={styles.cartButtonText}>Add To Cart</Text>
              </Pressable>
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
    backgroundColor: '#fff',
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
    color: '#555',
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
});
