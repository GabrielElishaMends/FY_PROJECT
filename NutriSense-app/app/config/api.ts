import Constants from 'expo-constants';

// Function to get the Google Gemini API key from environment variables only
export const getGoogleGenAIApiKey = (): string => {
  // Try process.env first (for newer Expo versions with EXPO_PUBLIC_ prefix)
  const envKey = process.env.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY;
  if (envKey) {
    console.log('✅ Using API key from .env file (process.env)');
    return envKey;
  }

  // Try Constants.expoConfig.extra (if loaded from .env into app config)
  const extraKey =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY;
  if (extraKey) {
    console.log('✅ Using API key from expo config extra');
    return extraKey;
  }

  // Try Constants.manifest.extra (for older Expo versions)
  const manifestKey = (Constants as any).manifest?.extra
    ?.EXPO_PUBLIC_GOOGLE_GENAI_API_KEY;
  if (manifestKey) {
    console.log('✅ Using API key from manifest extra config');
    return manifestKey;
  }

  // If no API key is found, throw an error instead of using hardcoded fallback
  throw new Error(
    '🔑 Google Gemini API key not found! Please ensure EXPO_PUBLIC_GOOGLE_GENAI_API_KEY is set in your .env file and restart the development server.'
  );
};

export default {
  googleGenAIApiKey: getGoogleGenAIApiKey(),
};
