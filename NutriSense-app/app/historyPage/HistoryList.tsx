import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BackendLink } from '@/components/Default';
import NoHistoryScreen from './NoHistoryScreen';

// Basic history item type that matches what's saved in Firebase
type HistoryItemType = {
  id: string;
  name: string;
  calories: string;
  carbs: number;
  protein: number;
  fat: number;
  imageUri: string | number;
  timeAgo: string;
  // Optional fields for backwards compatibility
  digestionComplexity?: string;
  digestionTime?: string;
  timeToEat?: string;
  additionalDigestionNotes?: string;
  benefits?: Array<{ title: string; info: string }>;
  cautions?: Array<{ title: string; info: string }>;
  nutrientBreakdown?: Array<{
    nutrient?: string;
    label?: string;
    info?: string;
    value?: string;
    percentDailyValue?: number;
    width?: string;
    color?: string;
  }>;
  detectionMethod?: 'search' | 'image';
  confidence?: number | null;
};

type Props = {
  data: HistoryItemType[];
};

const HistoryItem = ({ item }: { item: HistoryItemType }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${BackendLink}/search`, {
        params: { query: item.name },
      });

      const foodDetails = response.data;

      // Create nutrient breakdown using the saved nutrition values (includes top-ons)
      // Note: Using default FDA values since user profile isn't available in history context
      // Future enhancement: Could pass user profile from parent component
      const nutrientBreakdown = [
        {
          nutrient: 'Carbohydrate',
          info: `${item.carbs.toFixed(1)}g (${Math.round(
            (item.carbs / 300) * 100
          )}% DV)`,
          percentDailyValue: Math.round((item.carbs / 300) * 100),
          color: '#FF6B6B',
        },
        {
          nutrient: 'Protein',
          info: `${item.protein.toFixed(1)}g (${Math.round(
            (item.protein / 50) * 100
          )}% DV)`,
          percentDailyValue: Math.round((item.protein / 50) * 100),
          color: '#4ECDC4',
        },
        {
          nutrient: 'Fat',
          info: `${item.fat.toFixed(1)}g (${Math.round(
            (item.fat / 65) * 100
          )}% DV)`,
          percentDailyValue: Math.round((item.fat / 65) * 100),
          color: '#45B7D1',
        },
      ];

      // Ensure imageUri is properly converted to string
      const imageUri =
        typeof item.imageUri === 'string'
          ? item.imageUri
          : item.imageUri.toString();

      router.push({
        pathname: '/historyPage/HistoryDetailsScreen',
        params: {
          name: foodDetails.name,
          calories: item.calories, // Use saved calories (includes top-ons)
          imageUri: imageUri, // Keep the ORIGINAL image from history
          timeAgo: item.timeAgo,
          digestionComplexity: foodDetails.digestionComplexity,
          digestionTime: foodDetails.digestionTime,
          timeToEat: foodDetails.timeToEat,
          additionalDigestionNotes: foodDetails.additionalDigestionNotes,
          benefits: JSON.stringify(foodDetails.benefits || []),
          cautions: JSON.stringify(foodDetails.cautions || []),
          nutrientBreakdown: JSON.stringify(nutrientBreakdown), // Use calculated breakdown with saved values
          detectionMethod: item.detectionMethod || 'search',
          confidence: item.confidence || null,
          isUserUploadedImage:
            item.imageUri &&
            typeof item.imageUri === 'string' &&
            (item.imageUri.startsWith('http') ||
              item.imageUri.startsWith('gs://'))
              ? 'true'
              : 'false',
        },
      });
    } catch (error) {
      console.error('Error fetching food details:', error);
      alert('Could not fetch food details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.itemContainer, isLoading && styles.loadingContainer]}
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={isLoading}
    >
      <Image
        source={
          typeof item.imageUri === 'string'
            ? { uri: item.imageUri }
            : item.imageUri
        }
        style={[styles.foodImage, isLoading && styles.loadingImage]}
      />
      <View style={styles.foodInfo}>
        <View style={styles.nameCaloriesRow}>
          <Text style={styles.foodName} numberOfLines={1}>
            {item.name.length > 13 ? item.name.slice(0, 10) + '...' : item.name}
          </Text>
          <Text style={styles.foodCalories}>{item.calories} calories</Text>
        </View>
        <Text style={styles.timeAgo}>{item.timeAgo}</Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Add logging to the main component
const HistoryList = ({ data }: Props) => {
  // Show empty state when there's no data
  if (!data || data.length === 0) {
    return <NoHistoryScreen />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <HistoryItem item={item} />}
    />
  );
};

export default HistoryList;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 8,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameCaloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    maxWidth: '60%',
  },
  foodCalories: {
    fontSize: 16,
    color: '#777',
  },
  timeAgo: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  loadingContainer: {
    opacity: 0.7,
  },
  loadingImage: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});
