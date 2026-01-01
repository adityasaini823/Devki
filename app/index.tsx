import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { tokenStorage } from '../src/utils/tokenStorage';

export default function Welcome() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    
    useEffect(() => {
        checkAuthStatus();
    }, []);
    
    const checkAuthStatus = async () => {
        try {
            const token = await tokenStorage.getToken();
            const refreshToken = await tokenStorage.getRefreshToken();
            
            // If we have either token, user is potentially authenticated
            // The baseApi will handle token refresh automatically on API calls
            // If refresh token is expired, API will return 403 and we'll redirect to login
            if (token || refreshToken) {
                // User has tokens, redirect to tabs
                // baseApi will handle refreshing access token if needed
                router.replace('/(tabs)');
            } else {
                // No tokens at all, redirect to login
                router.replace('/(auth)/login');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // On error, clear tokens and redirect to login
            await tokenStorage.removeToken();
            router.replace('/(auth)/login');
        } finally {
            setIsChecking(false);
        }
    };
    
    const handleGetStarted = () => {
        router.push('/(auth)/login');
    };
    
    if (isChecking) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Checking authentication...</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>  
            <View>
                <Text style={styles.title}>Welcome to Devki</Text>
            </View>
            <Button title="Get Started" onPress={handleGetStarted} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});

