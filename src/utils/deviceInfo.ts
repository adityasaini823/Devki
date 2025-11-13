import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Check if running on a physical device (not simulator/emulator)
 */
export const isPhysicalDevice = (): boolean => {
  return Device.isDevice;
};

/**
 * Get device info for debugging
 */
export const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    isPhysicalDevice: isPhysicalDevice(),
    isSimulator: !isPhysicalDevice(),
  };
};

