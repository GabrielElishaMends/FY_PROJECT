import React from 'react';
import { Redirect } from 'expo-router';

// Root index - redirect to main app route
const RootIndex: React.FC = () => {
  return <Redirect href="/(tabs)/dash_board" />;
};

export default RootIndex;
