import React, { useState, useRef, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Animated,
    Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCompleteProfileMutation } from '../../src/redux/api/authApi';
import { tokenStorage } from '../../src/utils/tokenStorage';

interface InputFieldProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    required?: boolean;
    keyboardType?: 'default' | 'email-address' | 'number-pad';
    autoCapitalize?: 'none' | 'words' | 'sentences';
    returnKeyType?: 'next' | 'done';
    onSubmitEditing?: () => void;
    multiline?: boolean;
    maxLength?: number;
    secureTextEntry?: boolean;
    inputRef?: React.RefObject<TextInput | null>;
    error?: string;
}

const ModernInput: React.FC<InputFieldProps> = ({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    required = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    returnKeyType = 'next',
    onSubmitEditing,
    multiline = false,
    maxLength,
    secureTextEntry = false,
    inputRef,
    error,
}) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        if (inputRef && 'current' in inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        Animated.spring(scaleAnim, {
            toValue: 1.02,
            useNativeDriver: true,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const hasValue = value.length > 0;
    const showLabel = isFocused || hasValue;

    return (
        <View style={styles.fieldContainer}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handlePress}
                    style={[
                        styles.inputWrapper,
                        isFocused && [
                            styles.inputWrapperFocused,
                            {
                                borderColor: theme.colors.primary,
                                shadowColor: theme.colors.primary,
                            }
                        ],
                        error && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }
                    ]}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={icon}
                            size={20}
                            color={error ? '#EF4444' : (isFocused ? theme.colors.primary : '#9CA3AF')}
                        />
                    </View>
                    <View style={styles.inputContent}>
                        {showLabel && (
                            <View style={styles.floatingLabel}>
                                <Text style={[styles.floatingLabelText, { color: error ? '#EF4444' : theme.colors.primary }]}>
                                    {label} {required && <Text style={styles.required}>*</Text>}
                                </Text>
                            </View>
                        )}
                        <TextInput
                            ref={inputRef as any}
                            style={[
                                styles.modernInput,
                                multiline && styles.modernInputMultiline,
                                { color: '#111827' },
                            ]}
                            placeholder={showLabel ? '' : placeholder}
                            placeholderTextColor="#9CA3AF"
                            value={value}
                            onChangeText={onChangeText}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            keyboardType={keyboardType}
                            autoCapitalize={autoCapitalize}
                            returnKeyType={returnKeyType}
                            onSubmitEditing={onSubmitEditing}
                            multiline={multiline}
                            numberOfLines={multiline ? 3 : 1}
                            textAlignVertical={multiline ? 'top' : 'center'}
                            maxLength={maxLength}
                            secureTextEntry={secureTextEntry}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

export default function SignupDetails() {
    const router = useRouter();
    const { theme } = useTheme();
    const params = useLocalSearchParams();

    const phoneNumber = (params.phone as string) || '';

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Error state
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [completeProfile, { isLoading }] = useCompleteProfileMutation();

    // Refs
    const scrollRef = useRef<ScrollView>(null);
    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const addressRef = useRef<TextInput>(null);
    const cityRef = useRef<TextInput>(null);
    const stateRef = useRef<TextInput>(null);
    const pincodeRef = useRef<TextInput>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const successScaleAnim = useRef(new Animated.Value(0)).current;
    const checkmarkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (firstName.trim().length < 2) {
            newErrors.firstName = 'Name must be at least 2 characters';
        }

        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!address.trim()) {
            newErrors.address = 'Full address is required';
        } else if (address.trim().length < 5) {
            newErrors.address = 'Please enter a more detailed address';
        }

        if (!city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!state.trim()) {
            newErrors.state = 'State is required';
        }

        if (!pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (pincode.trim().length !== 6) {
            newErrors.pincode = 'Pincode must be exactly 6 digits';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // Scroll to top to show errors
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return false;
        }
        return true;
    };

    const completedFields = [
        firstName.trim().length >= 2,
        address.trim().length >= 5,
        city.trim().length >= 2,
        state.trim().length >= 2,
        pincode.trim().length === 6,
    ].filter(Boolean).length;

    const progress = (completedFields / 5) * 100;

    const handleSubmit = async () => {
        if (!validateForm()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Please check the highlighted fields.',
            });
            return;
        }

        Keyboard.dismiss();

        try {
            const response = await completeProfile({
                mobile: phoneNumber.replace(/\D/g, ''),
                first_name: firstName.trim(),
                last_name: lastName.trim() || undefined,
                email: email.trim() || undefined,
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                pincode: pincode.trim(),
            }).unwrap();

            if (response.token) await tokenStorage.saveToken(response.token);
            if (response.refreshToken) await tokenStorage.saveRefreshToken(response.refreshToken);
            if (response.user) await tokenStorage.saveUser(response.user);

            setShowSuccess(true);
            Animated.sequence([
                Animated.spring(successScaleAnim, {
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

            setTimeout(() => {
                router.replace('/(tabs)');
            }, 2000);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Setup Failed',
                text2: error?.data?.message || error?.message || 'Failed to complete profile. Try again.',
            });
        }
    };

    const formatPincode = (text: string) => text.replace(/\D/g, '').slice(0, 6);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary + '10', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Fixed Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Account Setup</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
                        </View>
                        <Text style={styles.progressText}>{completedFields} of 5 required fields</Text>
                    </View>
                </View>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        {/* Logo & Welcome */}
                        <View style={styles.welcomeSection}>
                            <View style={styles.logoWrapper}>
                                <View style={styles.logoContainer}>
                                    <Image
                                        source={require('../../assets/images/devki-logo.png')}
                                        style={styles.logo}
                                        contentFit="contain"
                                    />
                                </View>
                            </View>
                            <Text style={styles.welcomeTitle}>One last step!</Text>
                            <Text style={styles.welcomeSubtitle}>Help us know you better for better care</Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
                                <Text style={styles.cardTitle}>Basic Details</Text>
                            </View>

                            <ModernInput
                                inputRef={firstNameRef}
                                icon="person-outline"
                                label="First Name"
                                value={firstName}
                                onChangeText={(val) => {
                                    setFirstName(val);
                                    if (errors.firstName) setErrors(prev => {
                                        const n = { ...prev };
                                        delete n.firstName;
                                        return n;
                                    });
                                }}
                                placeholder="e.g. Rahul"
                                required
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => lastNameRef.current?.focus()}
                                error={errors.firstName}
                            />

                            <ModernInput
                                inputRef={lastNameRef}
                                icon="person-outline"
                                label="Last Name"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="e.g. Sharma (Optional)"
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => emailRef.current?.focus()}
                            />

                            <ModernInput
                                inputRef={emailRef}
                                icon="mail-outline"
                                label="Email"
                                value={email}
                                onChangeText={(val) => {
                                    setEmail(val);
                                    if (errors.email) setErrors(prev => {
                                        const n = { ...prev };
                                        delete n.email;
                                        return n;
                                    });
                                }}
                                placeholder="e.g. rahul@example.com (Optional)"
                                keyboardType="email-address"
                                returnKeyType="next"
                                onSubmitEditing={() => addressRef.current?.focus()}
                                error={errors.email}
                            />
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="location-outline" size={22} color={theme.colors.primary} />
                                <Text style={styles.cardTitle}>Address Details</Text>
                            </View>

                            <ModernInput
                                inputRef={addressRef}
                                icon="home-outline"
                                label="Full Address"
                                value={address}
                                onChangeText={(val) => {
                                    setAddress(val);
                                    if (errors.address) setErrors(prev => {
                                        const n = { ...prev };
                                        delete n.address;
                                        return n;
                                    });
                                }}
                                placeholder="House No, Building, Street..."
                                required
                                multiline
                                returnKeyType="next"
                                onSubmitEditing={() => cityRef.current?.focus()}
                                error={errors.address}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <ModernInput
                                        inputRef={cityRef}
                                        icon="business-outline"
                                        label="City"
                                        value={city}
                                        onChangeText={(val) => {
                                            setCity(val);
                                            if (errors.city) setErrors(prev => {
                                                const n = { ...prev };
                                                delete n.city;
                                                return n;
                                            });
                                        }}
                                        placeholder="City"
                                        required
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                        onSubmitEditing={() => stateRef.current?.focus()}
                                        error={errors.city}
                                    />
                                </View>
                                <View style={styles.halfWidth}>
                                    <ModernInput
                                        inputRef={stateRef}
                                        icon="map-outline"
                                        label="State"
                                        value={state}
                                        onChangeText={(val) => {
                                            setState(val);
                                            if (errors.state) setErrors(prev => {
                                                const n = { ...prev };
                                                delete n.state;
                                                return n;
                                            });
                                        }}
                                        placeholder="State"
                                        required
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                        onSubmitEditing={() => pincodeRef.current?.focus()}
                                        error={errors.state}
                                    />
                                </View>
                            </View>

                            <ModernInput
                                inputRef={pincodeRef}
                                icon="pin-outline"
                                label="Pincode"
                                value={pincode}
                                onChangeText={(text) => {
                                    setPincode(formatPincode(text));
                                    if (errors.pincode) setErrors(prev => {
                                        const n = { ...prev };
                                        delete n.pincode;
                                        return n;
                                    });
                                }}
                                placeholder="6-digit Pincode"
                                required
                                keyboardType="number-pad"
                                maxLength={6}
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit}
                                error={errors.pincode}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
                                isLoading && { opacity: 0.7 }
                            ]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Create Account</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.helperText}>
                            By creating an account, you agree to our terms and privacy policy.
                        </Text>

                        {/* Extra space for scrolling on small screens with keyboard */}
                        <View style={{ height: 100 }} />
                    </Animated.View>
                </ScrollView>

                {/* Success Modal */}
                <Modal visible={showSuccess} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <Animated.View style={[styles.successContainer, { transform: [{ scale: successScaleAnim }] }]}>
                            <Animated.View style={[styles.checkmarkCircle, { opacity: checkmarkAnim }]}>
                                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
                            </Animated.View>
                            <Text style={styles.successTitle}>Welcome to Devki!</Text>
                            <Text style={styles.successMessage}>Your profile is ready. Redirecting you...</Text>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        </Animated.View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 30,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    placeholder: {
        width: 32,
    },
    progressContainer: {
        width: '100%',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 10,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100, // Increased for better keyboard handling
    },
    content: {
        width: '100%',
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoWrapper: {
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 10,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        paddingHorizontal: 16,
        minHeight: 60,
    },
    inputWrapperFocused: {
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },
    iconContainer: {
        marginRight: 12,
    },
    inputContent: {
        flex: 1,
        justifyContent: 'center',
    },
    floatingLabel: {
        marginBottom: 2,
    },
    floatingLabelText: {
        fontSize: 12,
        fontWeight: '700',
    },
    required: {
        color: '#EF4444',
    },
    modernInput: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        paddingVertical: 4,
    },
    modernInputMultiline: {
        minHeight: 60,
        paddingTop: 8,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        height: 64,
        marginTop: 12,
        marginBottom: 16,
        gap: 10,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    helperText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 32,
        alignItems: 'center',
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    checkmarkCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    successMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
});
