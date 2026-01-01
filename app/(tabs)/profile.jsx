import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../_theme/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokenStorage } from "../../src/utils/tokenStorage";
import { useGetProfileQuery, useUpdateProfileMutation, useLogoutMutation } from "../../src/redux/api/authApi";
import { useRouter } from "expo-router";

export default function Profile() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animation refs
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Fetch profile data
  const { data: profileData, isLoading, isError, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const user = profileData?.user || {};

  // Load user data from local storage as fallback
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) {
        const localUser = await tokenStorage.getUser();
        if (localUser) {
          setFormData({
            first_name: localUser.first_name || "",
            last_name: localUser.last_name || "",
            email: localUser.email || "",
            address: localUser.address || "",
            city: localUser.city || "",
            state: localUser.state || "",
            pincode: localUser.pincode || "",
          });
        }
      }
    };
    loadUserData();
  }, []);

  // Update form data when profile loads
  useEffect(() => {
    if (user?.id) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
      });
    }
  }, [user]);

  // Animate drawer open
  const openDrawer = () => {
    setIsEditModalVisible(true);
    // Start from bottom (off-screen)
    drawerAnim.setValue(0);
    Animated.spring(drawerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
      velocity: 0,
    }).start();
  };

  // Animate drawer close
  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsEditModalVisible(false);
    });
  };

  // Handle edit button
  const handleEdit = () => {
    openDrawer();
  };

  // Handle save
  const handleSave = async () => {
    try {
      const response = await updateProfile(formData).unwrap();
      
      // Update local storage
      if (response.user) {
        await tokenStorage.saveUser(response.user);
      }
      
      // Close drawer
      closeDrawer();
      
      // Show success animation
      setShowSuccess(true);
      scaleAnim.setValue(0);
      checkmarkAnim.setValue(0);
      
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Refetch profile data
      refetch();
      
      // Auto close success modal
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      Alert.alert(
        "Error",
        error?.data?.message || error?.message || "Failed to update profile. Please try again."
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout().unwrap();
              await tokenStorage.removeToken();
              router.replace("/(auth)/login");
            } catch (error) {
              // Even if API call fails, clear local tokens
              await tokenStorage.removeToken();
              router.replace("/(auth)/login");
            }
          },
        },
      ]
    );
  };

  // Handle success modal close
  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  // Drawer translate animation - starts from bottom of screen
  const drawerTranslateY = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1000, 0], // Start further down to ensure it's off-screen
  });

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load profile: {error?.data?.message || error?.message || "Unknown error"}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
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
              {user.first_name || ""} {user.last_name || ""}
            </Text>
            <Text style={[styles.phone, { color: theme.colors.textSecondary }]}>
              {user.mobile || ""}
            </Text>
            {user.email && user.email !== "" && (
              <Text style={[styles.email, { color: theme.colors.textMuted }]}>
                {user.email}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.colors.border }]}
            onPress={handleEdit}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Section title="Delivery Address" icon="location-outline" theme={theme}>
          <Text style={[styles.bodyText, { color: theme.colors.textPrimary }]}>
            {user.address || ""}, {user.city || ""}, {user.state || ""}, {user.pincode || ""}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleEdit}
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
            onPress={() => Alert.alert("Help & Support", "Contact us at support@devki.com")}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.colors.error} />
            <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
              Help & Support
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.colors.error }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
            )}
            <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Drawer Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerOverlayPressable} onPress={closeDrawer} />
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                backgroundColor: theme.colors.card,
                transform: [{ translateY: drawerTranslateY }],
              },
            ]}
          >
              {/* Drag Handle */}
              <View style={styles.dragHandleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
              </View>

              <View style={styles.drawerHeader}>
                <Text style={[styles.drawerTitle, { color: theme.colors.textPrimary }]}>
                  Edit Profile
                </Text>
                <TouchableOpacity onPress={closeDrawer}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.drawerContentWrapper}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.drawerContentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      First Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      value={formData.first_name}
                      onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                      placeholder="Enter first name"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Last Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      value={formData.last_name}
                      onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                      placeholder="Enter last name"
                      placeholderTextColor={theme.colors.muted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Email
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      placeholder="Enter email"
                      placeholderTextColor={theme.colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Address *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      value={formData.address}
                      onChangeText={(text) => setFormData({ ...formData, address: text })}
                      placeholder="Enter address"
                      placeholderTextColor={theme.colors.muted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                        City *
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            color: theme.colors.textPrimary,
                          },
                        ]}
                        value={formData.city}
                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                        placeholder="City"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                        State *
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            color: theme.colors.textPrimary,
                          },
                        ]}
                        value={formData.state}
                        onChangeText={(text) => setFormData({ ...formData, state: text })}
                        placeholder="State"
                        placeholderTextColor={theme.colors.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                      Pincode *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      value={formData.pincode}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, "").slice(0, 6);
                        setFormData({ ...formData, pincode: cleaned });
                      }}
                      placeholder="Enter 6-digit pincode"
                      placeholderTextColor={theme.colors.muted}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </ScrollView>
              </View>

              <View style={[
                styles.drawerFooter,
                { backgroundColor: theme.colors.card }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  onPress={closeDrawer}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor:
                        formData.first_name && formData.address && formData.city && formData.state && formData.pincode
                          ? theme.colors.primary
                          : "#D1D5DB",
                    },
                  ]}
                  onPress={handleSave}
                  disabled={
                    isUpdating ||
                    !formData.first_name ||
                    !formData.address ||
                    !formData.city ||
                    !formData.state ||
                    !formData.pincode
                  }
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.checkmarkCircle,
                {
                  opacity: checkmarkAnim,
                  transform: [
                    {
                      scale: checkmarkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </Animated.View>

            <Text style={styles.successTitle}>Profile Updated!</Text>
            <Text style={styles.successMessage}>
              Your profile has been successfully updated.
            </Text>

            <View style={styles.successLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
  },
  phone: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  section: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionBody: {
    gap: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
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
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 20,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Drawer Modal Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawerOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    flexDirection: "column",
    overflow: "hidden",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  drawerContentWrapper: {
    flex: 1,
    minHeight: 0,
  },
  drawerContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  drawerFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    width: "100%", // Keep this
    alignSelf: 'stretch', // Add this to force it to fill the parent width
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  successLoader: {
    marginTop: 8,
  },
});
