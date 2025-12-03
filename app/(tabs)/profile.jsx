import React,{useState,useEffect} from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../_theme/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokenStorage } from "../../src/utils/tokenStorage";


export default function Profile() {
  const { theme } = useTheme();
  const [user, setUser] = useState({});
  useEffect(() => {
    const getUser = async () => {
      const user = await tokenStorage.getUser();
      setUser(user);
      console.log(user);
    }
    getUser();
  }, []);
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.card }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: theme.colors.accentSoft }]}
          >
            <Ionicons name="person" size={42} color={theme.colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text
              style={[styles.name, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {user.first_name} {user.last_name}
            </Text>
            <Text style={[styles.phone, { color: theme.colors.textSecondary }]}>
              {user.mobile}
            </Text>
            {user.email && user.email !== "" && (
              <Text style={[styles.email, { color: theme.colors.textMuted }]}
              >
                {user.email}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.colors.border }]}
            onPress={() => {
              alert("Edit profile tapped");
            }}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={theme.colors.primary}
            />
            {/* <Text style={[styles.editText, { color: theme.colors.primary }]}>Edit</Text> */}
          </TouchableOpacity>
        </View>

        <Section title="Delivery Address" icon="location-outline" theme={theme}>
          <Text style={[styles.bodyText, { color: theme.colors.textPrimary }]}
          >
            {user.address}, {user.city}, {user.state}, {user.pincode}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={() => alert("Change address")}
          >
            <Ionicons
              name="navigate-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.secondaryButtonText, { color: theme.colors.primary }]}
            >
              Change address
            </Text>
          </TouchableOpacity>
        </Section>


        <View style={styles.buttonGroup}>
        <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.colors.error }]}
            onPress={() => alert("Help & Support")}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.colors.error} />
            <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.colors.error }]}
            onPress={() => alert("Logout")}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
            <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, icon, children, theme }) => (
  <View
    style={[
      styles.section,
      {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
      },
    ]}
  >
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);


const styles = StyleSheet.create({
  // safeArea: { flex: 1 },
  container: { padding: 10, gap: 16 },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1 },
  name: { fontSize: 20, fontWeight: "700" },
  phone: { fontSize: 16, fontWeight: "500", marginTop: 4 },
  email: { fontSize: 14, marginTop: 2 },
  editButton: {
    position: "absolute",
    right: 0,
    top: "10%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: { fontSize: 14, fontWeight: "600" },
  section: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionBody: { gap: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: { fontSize: 15, fontWeight: "600" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: { fontSize: 13, fontWeight: "600" },
  bodyText: { fontSize: 15, lineHeight: 22 },
  secondaryButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600" },
  chipList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: "600" },
  buttonGroup: { gap: 12, marginBottom: 20 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dangerButtonText: { fontSize: 15, fontWeight: "700" },
});
