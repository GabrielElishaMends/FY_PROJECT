import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { AuthProvider, useAuth } from './AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const auth = useAuth();
  const userToken = auth?.userToken;
  const loading = auth?.loading;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || loading) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {userToken ? (
            // Main app tabs/screens
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="userProfile" />
              <Stack.Screen name="history" />
              <Stack.Screen name="+not-found" />
            </>
          ) : (
            // Auth screens
            <>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="+not-found" />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
