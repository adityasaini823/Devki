import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator, Alert, Modal, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
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
            Alert.alert(
                'Verification Failed',
                error?.data?.message || error?.message || 'Invalid OTP. Please check and try again.'
            );
        }
    };
    
    const handleResend = async () => {
        if (!cleanedPhone || cleanedPhone.length !== 10) {
            Alert.alert('Error', 'Phone number is missing or invalid.');
            return;
        }
        
        try {
            await sendLoginOTP({ mobile: cleanedPhone }).unwrap();
            Alert.alert('Success', 'OTP has been resent to ' + phoneNumber);
            setOtp(['', '', '', '']);
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || error?.message || 'Failed to resend OTP. Please try again.');
        }
    };
    
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.title}>Verify OTP</Text>
            
            <Text style={styles.instruction}>
                Enter the code sent to {phoneNumber}
            </Text>
            
            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        style={[
                            styles.otpInput,
                            {
                                borderColor: digit ? theme.colors.primary : '#E0E0E0',
                                color: theme.colors.text,
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
                        backgroundColor: (otp.join('').length === 4 && !isVerifying) ? '#8B5CF6' : '#D1D5DB',
                    }
                ]}
                onPress={handleVerify}
                disabled={otp.join('').length !== 4 || isVerifying}
            >
                {isVerifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
                )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend}>
                    <Text style={[styles.resendLink, { color: theme.colors.primary }]}>
                        Resend
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Success Confirmation Modal */}
            <Modal
                visible={showSuccess}
                transparent
                animationType="fade"
                onRequestClose={() => {}}
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
                        
                        <Text style={styles.successTitle}>Login Successful!</Text>
                        <Text style={styles.successMessage}>
                            Welcome back! You've been successfully logged in.
                        </Text>
                        
                        <View style={styles.successLoader}>
                            <ActivityIndicator size="small" color="#8B5CF6" />
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    instruction: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 32,
        textAlign: 'center',
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
        height: 56,
        borderWidth: 1,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
        backgroundColor: '#FFFFFF',
    },
    verifyButton: {
        width: '100%',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#6B7280',
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '600',
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
