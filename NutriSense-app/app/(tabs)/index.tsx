import { router } from 'expo-router';
import { useEffect } from 'react';

export default function IndexScreen() {
  useEffect(() => {
    // Redirect to dashboard when index is accessed
    router.replace('/(tabs)/dash_board');
  }, []);

  return null; // This component will redirect before rendering
}
