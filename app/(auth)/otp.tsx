import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';

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
        : '+91 98765 43210';
    
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    
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
    
    const handleVerify = () => {
        const otpCode = otp.join('');
        if (otpCode.length === 4) {
            // Navigate to next screen or verify OTP
            Keyboard.dismiss();
            // @ts-ignore
            router.push('/(auth)/signup-details');
        }
    };
    
    const handleResend = () => {
        // Handle resend OTP logic
        alert('OTP resent to ' + phoneNumber);
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
                        backgroundColor: otp.join('').length === 4 ? '#8B5CF6' : '#D1D5DB',
                    }
                ]}
                onPress={handleVerify}
                disabled={otp.join('').length !== 4}
            >
                <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend}>
                    <Text style={[styles.resendLink, { color: theme.colors.primary }]}>
                        Resend
                    </Text>
                </TouchableOpacity>
            </View>
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
});
