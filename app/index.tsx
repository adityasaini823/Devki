import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './_theme/ThemeProvider';
import { tokenStorage } from '../src/utils/tokenStorage';

const { width } = Dimensions.get('window');

export default function Welcome() {
    const router = useRouter();
    const { theme } = useTheme();
    const [isChecking, setIsChecking] = React.useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        checkAuthStatus();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await tokenStorage.getToken();
            const refreshToken = await tokenStorage.getRefreshToken();

            if (token || refreshToken) {
                // Small delay to show splash feel
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 1500);
            } else {
                setIsChecking(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            await tokenStorage.removeToken();
            setIsChecking(false);
        }
    };

    const handleGetStarted = () => {
        router.push('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary + 'CC']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <Image
                        source={require('../assets/images/devki-logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Devki</Text>
                    <Text style={styles.subtitle}>Compassion & Care at Home</Text>
                </Animated.View>
            </View>

            {isChecking ? (
                <View style={styles.footer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
            ) : (
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Get Started</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        width: 140,
        height: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 40,
        paddingBottom: 60,
        alignItems: 'center',
    },
    button: {
        width: '100%',
        height: 64,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '800',
    },
});

import { TouchableOpacity } from 'react-native';

