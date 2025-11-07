import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Login() {
    const router = useRouter();
    const [mobileNumber, setMobileNumber] = useState('');
    
    const handleLogin = () => {
        // @ts-ignore - Expo Router typed routes
        router.push('/(auth)/otp');
    };
    
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput 
                style={styles.input}
                placeholder="Enter your mobile number" 
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
            />
            <Button title="Get OTP" onPress={handleLogin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
    },
});

