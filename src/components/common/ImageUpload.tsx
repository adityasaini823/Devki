import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../api/adminApi';

interface ImageUploadProps {
    onUploadComplete?: (url: string) => void;
    initialImage?: string;
    folder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadComplete, initialImage, folder = 'devki_uploads' }) => {
    const [image, setImage] = useState<string | null>(initialImage || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            // setImage(result.assets[0].uri); // Don't show immediately, wait for upload? 
            // Or show preview then upload. Let's upload immediately for this admin use case.
            handleUpload(result.assets[0]);
        }
    };

    const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                formData.append('image', blob, 'upload.jpg');
            } else {
                // Native
                const localUri = asset.uri;
                const filename = localUri.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore
                formData.append('image', { uri: localUri, name: filename, type });
            }

            const response = await uploadImage(formData, folder);

            if (response && response.success) {
                const uploadedUrl = response.data.url;
                // Prepend API URL if it's a relative path and we want to show it?
                // The backend returns `/uploads/filename`.
                // If we want to show it, we need the base URL.
                // But maybe the parent component handles that.
                // Let's just pass the relative URL back.

                setImage(asset.uri); // Show local preview upon success
                if (onUploadComplete) onUploadComplete(uploadedUrl);
            } else {
                setError(response?.message || 'Upload failed');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={pickImage} style={styles.button} disabled={uploading}>
                <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Pick & Upload Image'}</Text>
            </TouchableOpacity>

            {uploading && <ActivityIndicator size="small" color="#0000ff" style={styles.loader} />}

            {error && <Text style={styles.error}>{error}</Text>}

            {image && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <Text style={styles.success}>Image uploaded!</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 10,
    },
    imageContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 5,
    },
    error: {
        color: 'red',
        marginTop: 10,
    },
    success: {
        color: 'green',
        fontSize: 12,
    }
});

export default ImageUpload;
