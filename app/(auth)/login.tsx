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
    TouchableWithoutFeedback,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../_theme/ThemeProvider';
import { useSendLoginOTPMutation } from '../../src/redux/api/authApi';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Login() {
    const router = useRouter();
    const { theme } = useTheme();
    const [mobileNumber, setMobileNumber] = useState('');
    const [sendLoginOTP, { isLoading }] = useSendLoginOTPMutation();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const limited = cleaned.slice(0, 10);
        if (limited.length <= 5) {
            return limited;
        } else {
            return `${limited.slice(0, 5)} ${limited.slice(5)}`;
        }
    };

    const handlePhoneChange = (text: string) => {
        const formatted = formatPhoneNumber(text);
        setMobileNumber(formatted);
        const cleaned = formatted.replace(/\D/g, '');
        if (cleaned.length === 10) {
            setTimeout(() => {
                Keyboard.dismiss();
            }, 100);
        }
    };

    const handleLogin = async () => {
        const cleanedNumber = mobileNumber.replace(/\D/g, '');
        if (cleanedNumber.length !== 10) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Number',
                text2: 'Please enter a valid 10-digit mobile number',
            });
            return;
        }

        Keyboard.dismiss();

        try {
            await sendLoginOTP({ mobile: cleanedNumber }).unwrap();
            router.push({
                pathname: '/(auth)/otp',
                params: {
                    phone: cleanedNumber,
                },
            });
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || 'Failed to send OTP. Please check your connection and try again.';
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: errorMessage,
            });
        }
    };

    const cleanedNumber = mobileNumber.replace(/\D/g, '');
    const isValid = cleanedNumber.length === 10;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary + '10', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.content,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
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
                                <Text style={styles.title}>Welcome back</Text>
                                <Text style={styles.subtitle}>Enter your mobile number to get started</Text>
                            </View>

                            <View style={styles.card}>
                                <Text style={styles.cardLabel}>Mobile Number</Text>
                                <View style={[
                                    styles.inputContainer,
                                    { borderColor: isValid ? theme.colors.primary : '#E5E7EB' }
                                ]}>
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+91</Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="98765 43210"
                                        placeholderTextColor="#9CA3AF"
                                        value={mobileNumber}
                                        onChangeText={handlePhoneChange}
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                        autoFocus
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        {
                                            backgroundColor: isValid ? theme.colors.primary : '#9CA3AF',
                                            shadowColor: theme.colors.primary,
                                        }
                                    ]}
                                    onPress={handleLogin}
                                    disabled={!isValid || isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Continue</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.termsText}>
                                By continuing, you agree to our{' '}
                                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Terms of Service</Text> and{' '}
                                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Privacy Policy</Text>
                            </Text>
                        </Animated.View>
                    </ScrollView>
                </TouchableWithoutFeedback>
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        alignItems: 'center',
    },
    logoWrapper: {
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
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
    cardLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        marginLeft: 4,
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        height: 60,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    countryCode: {
        marginRight: 12,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#D1D5DB',
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    button: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    termsText: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 40,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});
