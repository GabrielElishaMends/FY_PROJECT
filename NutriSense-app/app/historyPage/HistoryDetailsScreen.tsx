import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { BackendLink } from '@/components/Default';
import HomeInsights from '../homePage/HomeInsights';
import HistoryPageStyles from '../styles/HistoryPageStyles';
import colors from '../config/colors';

export default function HistoryDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(params.isLoading === 'true');
  const [foodDetails, setFoodDetails] = useState({
    name: params.name as string,
    calories: params.calories as string,
    imageUri: params.imageUri as string,
    digestionTime: '',
    timeToEat: '',
    digestionComplexity: '',
    additionalDigestionNotes: '',
    benefits: [],
    cautions: [],
    nutrientBreakdown: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Safely parse JSON data with fallbacks
  const parseFoodData = (
    jsonString: string | undefined,
    defaultValue: any = []
  ) => {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      return defaultValue;
    }
  };

  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!isLoading) {
        // Data already available from params
        setFoodDetails({
          name: params.name as string,
          calories: params.calories as string,
          imageUri: params.imageUri as string, // This should be the original image
          digestionTime: params.digestionTime as string,
          timeToEat: params.timeToEat as string,
          digestionComplexity: params.digestionComplexity as string,
          additionalDigestionNotes: params.additionalDigestionNotes as string,
          benefits: parseFoodData(params.benefits as string),
          cautions: parseFoodData(params.cautions as string),
          nutrientBreakdown: parseFoodData(params.nutrientBreakdown as string),
        });
        return;
      }

      try {
        const response = await axios.get(`${BackendLink}/search`, {
          params: { query: params.name },
        });

        const fetchedData = response.data;

        setFoodDetails({
          name: fetchedData.name,
          calories: fetchedData.numCalories,
          imageUri: params.imageUri as string, // Keep the original image from history
          digestionTime: fetchedData.digestionTime,
          timeToEat: fetchedData.timeToEat,
          digestionComplexity: fetchedData.digestionComplexity,
          additionalDigestionNotes: fetchedData.additionalDigestionNotes,
          benefits: fetchedData.benefits || [],
          cautions: fetchedData.cautions || [],
          nutrientBreakdown: fetchedData.nutrientBreakdown || [],
        });
      } catch (error) {
        console.error('Error fetching food details:', error);
        setError('Failed to load food details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodDetails();
  }, [
    params.name,
    params.isLoading,
    params.calories,
    params.imageUri,
    params.digestionTime,
    params.timeToEat,
    params.digestionComplexity,
    params.additionalDigestionNotes,
    params.benefits,
    params.cautions,
    params.nutrientBreakdown,
  ]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Loading food details...</Text>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.errorContainer}>
      <Feather name="alert-circle" size={50} color="#F44336" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setError(null);
          setIsLoading(true);
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Add this right before passing to HomeInsights
  // console.log(
  //   '🎯 HistoryDetailsScreen - Passing imageUri to HomeInsights:',
  //   foodDetails.imageUri
  // );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={HistoryPageStyles.headerTab}>
        <TouchableOpacity
          style={HistoryPageStyles.backbutton}
          onPress={handleGoBack}
        >
          <Feather name="arrow-left" size={30} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={HistoryPageStyles.title}>Food History</Text>
      </View>

      {isLoading ? (
        renderLoadingScreen()
      ) : error ? (
        renderErrorScreen()
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          style={styles.content}
        >
          <HomeInsights
            foodName={foodDetails.name}
            numCalories={foodDetails.calories}
            imageSource={foodDetails.imageUri}
            digestionTime={foodDetails.digestionTime}
            timeToEat={foodDetails.timeToEat}
            digestionComplexity={foodDetails.digestionComplexity}
            additionalDigestionNotes={foodDetails.additionalDigestionNotes}
            benefits={foodDetails.benefits}
            cautions={foodDetails.cautions}
            nutrientBreakdown={foodDetails.nutrientBreakdown}
            onBack={() => router.back()}
            // Don't pass onNewFood and showFAB defaults to false
            // This means no FAB will appear when accessed from history
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: colors.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
