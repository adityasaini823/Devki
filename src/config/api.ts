import { Platform } from 'react-native';

// ============================================
// API Configuration - UPDATE THESE VALUES
// ============================================
// Your computer's local IP address (found via: ipconfig on Windows)
const YOUR_LOCAL_IP = '192.168.1.43'; // ⬅️ UPDATE THIS with your computer's IP

// Backend server port
const API_PORT = 3001; // ⬅️ Make sure this matches your backend port

// ============================================
// How to find your IP:
// Windows: Open CMD → type: ipconfig → Look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi"
// Mac/Linux: Open Terminal → type: ifconfig → Look for inet address under your Wi-Fi interface
// ============================================

const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator: Use 10.0.2.2 to access host machine
      // For Android physical device: Use YOUR_LOCAL_IP
      return `http://10.0.2.2:${API_PORT}/api`;
      // Uncomment below for Android physical device:
      // return `http://${YOUR_LOCAL_IP}:${API_PORT}/api`;
    } else {
      // iOS: Use YOUR_LOCAL_IP for both simulator and physical device
      // For iOS simulator, you can also use 'localhost' if preferred
      return `http://${YOUR_LOCAL_IP}:${API_PORT}/api`;
      // For iOS simulator only, you can use:
      // return `http://localhost:${API_PORT}/api`;
    }
  }
  // Production URL - update this with your actual production API
  return 'https://your-production-api.com/api';
};

const baseURL = getBaseURL();

// Log the API URL in development for debugging
if (__DEV__) {
  console.log('API Base URL:', baseURL);
  console.log('Platform:', Platform.OS);
}

export const API_CONFIG = {
  BASE_URL: baseURL,
  TIMEOUT: 10000, // 10 seconds
};

export default API_CONFIG;

