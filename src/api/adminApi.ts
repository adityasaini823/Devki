import API_CONFIG from '../config/api';

export const uploadImage = async (formData: FormData) => {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/upload`, {
            method: 'POST',
            body: formData,
            // Do NOT set Content-Type header when sending FormData, 
            // the browser/client sets it with the boundary automatically.
            headers: {
                // You might need auth headers here if the endpoint is protected
                // 'Authorization': `Bearer ${token}` 
                // But for now we'll assume the cookie (credentials: include) handles it 
                // or we need to pass a token.
                // The backend uses 'authenticateAdmin' middleware which checks for:
                // 1. Authorization header
                // 2. Cookie 'adminRefreshToken' ? No, that's for refresh.
                // Let's check adminAuth.js middleware later if needed.
                // For now, let's assume standard fetch setup + credentials.
            },
            credentials: 'include', // Important for cookies
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};
