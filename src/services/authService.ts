import API_CONFIG from '../config/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('API Request:', url, options);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON Parse Error:', jsonError);
          throw new Error('Invalid response from server');
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      
      // Network errors (connection refused, no internet, etc.)
      if (error.message && (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      )) {
        throw new Error(
          `Cannot connect to server. Please check:\n` +
          `1. Backend server is running on port 3000\n` +
          `2. API URL is correct: ${this.baseURL}\n` +
          `3. Your device/emulator can reach the server`
        );
      }
      
      // Re-throw with original message if it's already a formatted error
      if (error.message) {
        throw error;
      }
      
      // Generic fallback
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Send OTP for login
  async sendLoginOTP(mobile: string): Promise<ApiResponse<any>> {
    return this.request('/auth/send-login-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile: `+91${mobile}` }),
    });
  }

  // Verify OTP
  async verifyOTP(mobile: string, otp: string): Promise<ApiResponse<any>> {
    return this.request('/auth/verify-login-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile: `+91${mobile}`, otp }),
    });
  }

  // Complete profile
  async completeProfile(profileData: {
    mobile: string;
    first_name: string;
    last_name?: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({
        ...profileData,
        mobile: `+91${profileData.mobile}`,
      }),
    });
  }
}

export default new AuthService();

