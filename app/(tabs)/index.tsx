import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{
            uri: "https://picsum.photos/800/400", // random banner image
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Welcome to MyApp</Text>
          <Text style={styles.heroSubtitle}>Discover amazing features</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recommended for you</Text>

      {/* Cards Section */}
      <View style={styles.cardGrid}>
        {[1, 2, 3, 4].map((item) => (
          <TouchableOpacity key={item} style={styles.card}>
            <Image
              source={{ uri: `https://picsum.photos/200/200?random=${item}` }}
              style={styles.cardImage}
            />
            <Text style={styles.cardTitle}>Item {item}</Text>
            <Text style={styles.cardDescription}>Some quick description</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  heroContainer: {
    position: "relative",
    height: 200,
    marginBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: "#555",
  },
});
