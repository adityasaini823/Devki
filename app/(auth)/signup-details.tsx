import React, { useState, useRef } from 'react';
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
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../src/services/authService';

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
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

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
        <Animated.View style={[styles.inputContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isFocused ? '#8B5CF6' : '#9CA3AF'}
                    />
                </View>
                <View style={styles.inputContent}>
                    {showLabel && (
                        <Animated.View style={styles.floatingLabel}>
                            <Text style={styles.floatingLabelText}>
                                {label} {required && <Text style={styles.required}>*</Text>}
                            </Text>
                        </Animated.View>
                    )}
                    <TextInput
                        ref={inputRef}
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
            </View>
        </Animated.View>
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
    const [loading, setLoading] = useState(false);
    
    const firstNameRef = useRef<TextInput>(null);
    const lastNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const addressRef = useRef<TextInput>(null);
    const cityRef = useRef<TextInput>(null);
    const stateRef = useRef<TextInput>(null);
    const pincodeRef = useRef<TextInput>(null);
    
    const isFormValid = () => {
        return (
            firstName.trim().length >= 2 &&
            address.trim().length >= 5 &&
            city.trim().length >= 2 &&
            state.trim().length >= 2 &&
            pincode.trim().length === 6
        );
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
        if (!isFormValid()) {
            Alert.alert(
                'Almost There!',
                'Please complete all required fields to continue.'
            );
            return;
        }
        
        Keyboard.dismiss();
        setLoading(true);
        
        try {
            const response = await authService.completeProfile({
                mobile: phoneNumber.replace(/\D/g, ''),
                first_name: firstName.trim(),
                last_name: lastName.trim() || undefined,
                email: email.trim() || undefined,
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                pincode: pincode.trim(),
            });
            
            if (response.success && response.token) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', response.message || 'Failed to complete profile. Please try again.');
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'Failed to complete profile. Please check your connection and try again.'
            );
        } finally {
            setLoading(false);
        }
    };
    
    const formatPincode = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        return cleaned.slice(0, 6);
    };
    
    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.container}>
                {/* Header with Progress */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Complete Profile</Text>
                        <View style={styles.placeholder} />
                    </View>
                    
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            {completedFields} of 5 fields completed
                        </Text>
                    </View>
                </View>
                
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Welcome Section */}
                        <View style={styles.welcomeSection}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person" size={40} color="#8B5CF6" />
                            </View>
                            <Text style={styles.welcomeTitle}>Let's get you set up!</Text>
                            <Text style={styles.welcomeSubtitle}>
                                We need a few details to personalize your experience
                            </Text>
                        </View>
                        
                        {/* Personal Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="person-circle-outline" size={24} color="#8B5CF6" />
                                <Text style={styles.cardTitle}>Personal Information</Text>
                            </View>
                            
                            <ModernInput
                                icon="person-outline"
                                label="First Name"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                required
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => lastNameRef.current?.focus()}
                            />
                            
                            <ModernInput
                                inputRef={lastNameRef}
                                icon="person-outline"
                                label="Last Name"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name (Optional)"
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => emailRef.current?.focus()}
                            />
                            
                            <ModernInput
                                inputRef={emailRef}
                                icon="mail-outline"
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email (Optional)"
                                keyboardType="email-address"
                                returnKeyType="next"
                                onSubmitEditing={() => addressRef.current?.focus()}
                            />
                        </View>
                        
                        {/* Address Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="location-outline" size={24} color="#8B5CF6" />
                                <Text style={styles.cardTitle}>Delivery Address</Text>
                            </View>
                            
                            <ModernInput
                                inputRef={addressRef}
                                icon="home-outline"
                                label="Complete Address"
                                value={address}
                                onChangeText={setAddress}
                                placeholder="House/Flat No., Street, Area"
                                required
                                multiline
                                returnKeyType="next"
                                onSubmitEditing={() => cityRef.current?.focus()}
                            />
                            
                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <ModernInput
                                        inputRef={cityRef}
                                        icon="business-outline"
                                        label="City"
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder="City"
                                        required
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                        onSubmitEditing={() => stateRef.current?.focus()}
                                    />
                                </View>
                                
                                <View style={styles.halfWidth}>
                                    <ModernInput
                                        inputRef={stateRef}
                                        icon="map-outline"
                                        label="State"
                                        value={state}
                                        onChangeText={setState}
                                        placeholder="State"
                                        required
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                        onSubmitEditing={() => pincodeRef.current?.focus()}
                                    />
                                </View>
                            </View>
                            
                            <ModernInput
                                inputRef={pincodeRef}
                                icon="pin-outline"
                                label="Pincode"
                                value={pincode}
                                onChangeText={(text) => setPincode(formatPincode(text))}
                                placeholder="6-digit Pincode"
                                required
                                keyboardType="number-pad"
                                maxLength={6}
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit}
                            />
                        </View>
                        
                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                isFormValid() && !loading && styles.submitButtonActive,
                            ]}
                            onPress={handleSubmit}
                            disabled={!isFormValid() || loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Complete Setup</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <Text style={styles.helperText}>
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    placeholder: {
        width: 32,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    content: {
        width: '100%',
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#E9D5FF',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 12,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        minHeight: 56,
    },
    inputWrapperFocused: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FFFFFF',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
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
        marginBottom: 4,
    },
    floatingLabelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    required: {
        color: '#EF4444',
    },
    modernInput: {
        fontSize: 16,
        color: '#111827',
        paddingVertical: 0,
        minHeight: 24,
    },
    modernInputMultiline: {
        minHeight: 60,
        paddingTop: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D1D5DB',
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 8,
        marginBottom: 16,
        gap: 8,
    },
    submitButtonActive: {
        backgroundColor: '#8B5CF6',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    helperText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
    },
});
