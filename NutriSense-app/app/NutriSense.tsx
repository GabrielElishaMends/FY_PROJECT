import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './homePage/homeScreen';
import HistoryScreen from './historyPage/history';
import SignLog from './(auth)/signlog';
import Login from './(auth)/Login';
import Signup from './(auth)/Signup';
import UserProfile from './homePage/userProfile';
import FoodInsightsScreen from './insightsPage/FoodInsightsScreen';
import EditProfile from './homePage/EditProfile';
import FoodDetailsScreen from './insightsPage/FoodDetailsScreen';
import DashboardScreen from './Dashboard/dashboard';

// Define the stack param list
export type RootStackParamList = {
  SignLog: undefined;
  Login: undefined;
  HomeScreen: undefined;
  HistoryScreen: undefined;
  Signup: undefined;
  UserProfile: undefined;
  FoodInsightsScreen: undefined;
  EditProfile: undefined;
  FoodDetailsScreen: undefined;
  HistoryDetailsScreen: undefined;
  Dashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const NutriSense = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="SignLog" component={SignLog} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="FoodInsightsScreen" component={FoodInsightsScreen} />
      <Stack.Screen name="FoodDetailsScreen" component={FoodDetailsScreen} />
      <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
};

export default NutriSense;
