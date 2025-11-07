import React, { useState } from 'react';
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
    TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';

export default function Login() {
    const router = useRouter();
    const { theme } = useTheme();
    const [mobileNumber, setMobileNumber] = useState('');
    
    const formatPhoneNumber = (text: string) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '');
        
        // Limit to 10 digits
        const limited = cleaned.slice(0, 10);
        
        // Format as Indian phone number
        if (limited.length <= 5) {
            return limited;
        } else {
            return `${limited.slice(0, 5)} ${limited.slice(5)}`;
        }
    };
    
    const handlePhoneChange = (text: string) => {
        const formatted = formatPhoneNumber(text);
        setMobileNumber(formatted);
        
        // Auto-dismiss keyboard when 10 digits are entered
        const cleaned = formatted.replace(/\D/g, '');
        if (cleaned.length === 10) {
            // Small delay to ensure the input is updated first
            setTimeout(() => {
                Keyboard.dismiss();
            }, 100);
        }
    };
    
    const handleLogin = () => {
        const cleanedNumber = mobileNumber.replace(/\D/g, '');
        if (cleanedNumber.length === 10) {
            Keyboard.dismiss();
            router.push({
                pathname: '/otp',
                params: { phone: cleanedNumber },
            });
        } else {
            alert('Please enter a valid 10-digit mobile number');
        }
    };
    
    const cleanedNumber = mobileNumber.replace(/\D/g, '');
    const isValid = cleanedNumber.length === 10;
    
    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.card }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>Login</Text>
                        <Text style={styles.subtitle}>Enter your mobile number to continue</Text>
                        
                        <View style={styles.inputContainer}>
                            <View style={styles.countryCode}>
                                <Text style={[styles.countryCodeText, { color: theme.colors.text }]}>+91</Text>
                            </View>
                            <TextInput 
                                style={[
                                    styles.input,
                                    {
                                        borderColor: mobileNumber ? theme.colors.primary : '#E0E0E0',
                                        color: theme.colors.text,
                                    }
                                ]}
                                placeholder="98765 43210" 
                                placeholderTextColor={theme.colors.muted}
                                value={mobileNumber}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={12} // 5 digits + space + 5 digits
                                // returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                        </View>
                        
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    backgroundColor: isValid ? '#8B5CF6' : '#D1D5DB',
                                }
                            ]}
                            onPress={handleLogin}
                            disabled={!isValid}
                        >
                            <Text style={styles.buttonText}>Get OTP</Text>
                        </TouchableOpacity>
                        
                        <Text style={[styles.termsText, { color: theme.colors.muted }]}>
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </Text>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingBottom: 100,
        backgroundColor: '#FFFFFF',
    },
    content: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'center',
    },
    countryCode: {
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRightWidth: 0,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '500',
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
    },
    button: {
        width: '100%',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    termsText: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 24,
        marginTop: 8,
    },
});
