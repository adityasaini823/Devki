import React, { useState, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator, Alert, Modal, Animated, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVerifyOTPMutation, useSendLoginOTPMutation } from '../../src/redux/api/authApi';
import { tokenStorage } from '../../src/utils/tokenStorage';

export default function Otp() {
    const router = useRouter();
    const { theme } = useTheme();
    const params = useLocalSearchParams();

    // Format phone number for display
    const formatPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
        }
        return phone.startsWith('+91') ? phone : `+91 ${phone}`;
    };

    const phoneNumber = params.phone
        ? formatPhoneNumber(params.phone as string)
        : '';

    const cleanedPhone = params.phone ? (params.phone as string).replace(/\D/g, '') : '';

    const [otp, setOtp] = useState(['', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
    const [sendLoginOTP, { isLoading: isResending }] = useSendLoginOTPMutation();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const checkmarkAnim = useRef(new Animated.Value(0)).current;

    const handleOtpChange = (text: string, index: number) => {
        // Only allow numbers
        const numericText = text.replace(/[^0-9]/g, '');

        if (numericText.length > 1) {
            // Handle paste
            const digits = numericText.slice(0, 4).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 4) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);

            // Check if all digits are filled
            const allFilled = newOtp.every(digit => digit !== '');
            if (allFilled) {
                Keyboard.dismiss();
            } else {
                // Focus the last filled input or the next empty one
                const nextIndex = Math.min(index + digits.length, 3);
                inputRefs.current[nextIndex]?.focus();
            }
        } else {
            const newOtp = [...otp];
            newOtp[index] = numericText;
            setOtp(newOtp);

            // Check if all digits are filled (last digit entered)
            const allFilled = newOtp.every(digit => digit !== '');
            if (allFilled) {
                Keyboard.dismiss();
            } else if (numericText && index < 3) {
                // Auto-focus next input
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 4) {
            return;
        }

        if (!cleanedPhone || cleanedPhone.length !== 10) {
            Alert.alert('Error', 'Phone number is missing or invalid.');
            return;
        }

        Keyboard.dismiss();

        try {
            const response = await verifyOTP({ mobile: cleanedPhone, otp: otpCode }).unwrap();

            if (response.needsProfile) {
                router.push({
                    pathname: '/(auth)/signup-details',
                    params: { phone: cleanedPhone },
                });
            } else {
                // Store tokens and user data for existing users
                if (response.token) {
                    await tokenStorage.saveToken(response.token);
                }
                if (response.refreshToken) {
                    await tokenStorage.saveRefreshToken(response.refreshToken);
                }
                if (response.user) {
                    await tokenStorage.saveUser(response.user);
                }

                // Show success confirmation
                setShowSuccess(true);

                // Animate success modal
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

                // Navigate to home after 2 seconds
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 2000);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Verification Failed',
                text2: error?.data?.message || error?.message || 'Invalid OTP. Please check and try again.',
            });
        }
    };

    const handleResend = async () => {
        if (!cleanedPhone || cleanedPhone.length !== 10) {
            Alert.alert('Error', 'Phone number is missing or invalid.');
            return;
        }

        try {
            await sendLoginOTP({ mobile: cleanedPhone }).unwrap();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'OTP has been resent to ' + phoneNumber,
            });
            setOtp(['', '', '', '']);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.data?.message || error?.message || 'Failed to resend OTP. Please try again.',
            });
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary + '10', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoWrapper}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/devki-logo.png')}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>
                </View>

                <View style={styles.textSection}>
                    <Text style={styles.title}>Verification</Text>
                    <Text style={styles.subtitle}>Enter the 4-digit code sent to</Text>
                    <Text style={[styles.phoneText, { color: theme.colors.primary }]}>{phoneNumber}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[
                                    styles.otpInput,
                                    {
                                        borderColor: digit ? theme.colors.primary : '#E5E7EB',
                                        backgroundColor: digit ? theme.colors.primary + '05' : '#F9FAFB',
                                    }
                                ]}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            {
                                backgroundColor: (otp.join('').length === 4 && !isVerifying) ? theme.colors.primary : '#9CA3AF',
                                shadowColor: theme.colors.primary,
                            }
                        ]}
                        onPress={handleVerify}
                        disabled={otp.join('').length !== 4 || isVerifying}
                    >
                        {isVerifying ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Verify OTP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive code? </Text>
                        <TouchableOpacity onPress={handleResend} disabled={isResending}>
                            {isResending ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                            ) : (
                                <Text style={[styles.resendLink, { color: theme.colors.primary }]}>
                                    Resend
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color="#6B7280" />
                    <Text style={styles.backButtonText}>Change Number</Text>
                </TouchableOpacity>
            </View>

            {/* Success Confirmation Modal */}
            <Modal
                visible={showSuccess}
                transparent
                animationType="fade"
                onRequestClose={() => { }}
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

                        <Text style={styles.successTitle}>Verified!</Text>
                        <Text style={styles.successMessage}>
                            Your mobile number has been successfully verified.
                        </Text>

                        <View style={styles.successLoader}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    logoWrapper: {
        marginBottom: 32,
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
        borderRadius: 24,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    phoneText: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        gap: 12,
    },
    otpInput: {
        width: 56,
        height: 60,
        borderWidth: 1.5,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    verifyButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#6B7280',
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        padding: 8,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
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
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    successLoader: {
        marginTop: 8,
    },
});
