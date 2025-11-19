const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const getBaseURL = (): string => {
  if (!envUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set. Please check your .env or app configuration.'
    );
  }

  let url = envUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  
  if (__DEV__) {
    console.log('Final API Base URL:', url);
  }

  return url;
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 10000,
};

export default API_CONFIG;