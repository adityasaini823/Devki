import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Welcome() {
    const router = useRouter();
    
    const handleGetStarted = () => {
        // router.push('/(auth)/login');
        router.push('/(tabs)');
    };
    
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

