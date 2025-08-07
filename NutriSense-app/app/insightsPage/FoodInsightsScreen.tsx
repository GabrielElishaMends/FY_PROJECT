import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackendLink } from '../../components/Default';
import colors from '../config/colors';
import InsightsPageStyle from '../styles/InsightPageStyles';

import foodImages from '../../assets/foodImages/foodImages';

type TabName = 'Digestive' | 'Health' | 'Nutrients';

interface Food {
  _id: string;
  name: string;
  numCalories: number;
}

const FoodInsightsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>('Digestive');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true); // Start loading
        const response = await axios.get(`${BackendLink}/food`);
        setFoods(response.data);
      } catch (error) {
        console.error('Error fetching food data:', error);
      } finally {
        setLoading(false); // Stop loading
      }
    };
    fetchFoods();
  }, []);

  const getFoodImage = (name: string) => {
    if (!name) return null;
    const key = name.toLowerCase().replace(/_/g, ' ').trim();
    return foodImages[key] || foodImages[name.toLowerCase()];
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Status Bar Background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.tertiary,
          zIndex: 1000,
        }}
      />
      <StatusBar style="dark" />
      <SafeAreaView style={InsightsPageStyle.modernSafeContainer}>
        {/* Modern Header Section with Gradient */}
        <View style={InsightsPageStyle.modernHeaderSection}>
          <LinearGradient
            colors={[colors.tertiary, '#2E7D32']} // From tertiary to slightly darker green (same as FoodDetailsScreen)
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <View style={InsightsPageStyle.headerContent}>
            <View style={InsightsPageStyle.titleContainer}>
              <Text style={InsightsPageStyle.modernPageTitle}>
                Food Library
              </Text>
              <Text style={InsightsPageStyle.modernPageSubtitle}>
                Explore nutritional benefits and digestive properties
              </Text>
            </View>
            <View style={InsightsPageStyle.headerIconContainer}>
              <Feather name="info" size={24} color="#fff" />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={InsightsPageStyle.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tertiary} />
            <Text style={InsightsPageStyle.loadingText}>
              Loading food library...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={InsightsPageStyle.modernScrollView}
            contentContainerStyle={InsightsPageStyle.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={InsightsPageStyle.modernContainer}>
              {foods.map((food, index) => {
                const imageSource = getFoodImage(food.name);

                return (
                  <TouchableOpacity
                    key={food._id}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/insightsPage/FoodDetailsScreen',
                        params: { foodId: food._id },
                      })
                    }
                    style={[
                      InsightsPageStyle.modernFoodCard,
                      { marginTop: index === 0 ? 0 : 20 },
                    ]}
                  >
                    <ImageBackground
                      source={imageSource}
                      style={InsightsPageStyle.modernHeaderImage}
                      imageStyle={InsightsPageStyle.foodImageStyle}
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={InsightsPageStyle.modernGradientOverlay}
                      >
                        <View style={InsightsPageStyle.foodContentContainer}>
                          <Text style={InsightsPageStyle.modernFoodName}>
                            {food.name}
                          </Text>
                          <View style={InsightsPageStyle.bottomRow}>
                            <View style={InsightsPageStyle.caloriesBadge}>
                              <Feather name="zap" size={14} color="#fff" />
                              <Text
                                style={InsightsPageStyle.modernFoodCalories}
                              >
                                {food.numCalories} kcal
                              </Text>
                            </View>
                            <View style={InsightsPageStyle.tapIndicator}>
                              <Feather
                                name="arrow-right"
                                size={20}
                                color="#fff"
                              />
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

export default FoodInsightsScreen;
