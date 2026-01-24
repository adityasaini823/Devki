import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/wallet')}
        style={styles.iconButton}
      >
        <Ionicons name="wallet" size={28} color="#fff" />
      </TouchableOpacity>
      {/* <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile')}
        style={styles.iconButton}
      >
        <Ionicons name="person-circle" size={36} color="#fff" />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  iconButton: {
    padding: 4,
  },
});

