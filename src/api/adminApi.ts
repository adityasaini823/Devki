import API_CONFIG from '../config/api';
import { tokenStorage } from '../utils/tokenStorage';

export const uploadImage = async (formData: FormData, folder: string = 'devki_uploads') => {
    try {
        const token = await tokenStorage.getToken();

        // Remove trailing slash if present to avoid double slash
        const baseUrl = API_CONFIG.BASE_URL.endsWith('/')
            ? API_CONFIG.BASE_URL.slice(0, -1)
            : API_CONFIG.BASE_URL;

        const response = await fetch(`${baseUrl}/upload?folder=${folder}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};
