import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import InsightsPageStyle from '../styles/InsightPageStyles';
import colors from '../config/colors';
import axios from 'axios';
import { BackendLink } from '@/components/Default';
import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import foodImages from '../../assets/foodImages/foodImages';

type TabName = 'Digestive' | 'Health' | 'Nutrients';

interface Food {
  _id: string;
  name: string;
  numCalories: number;
}

const FoodInsightsScreen: React.FC = () => {
  const router = useRouter();
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
    <SafeAreaView style={InsightsPageStyle.modernSafeContainer}>
      <StatusBar style="light" backgroundColor={colors.tertiary} />
      {/* Modern Header Section */}
      <View style={InsightsPageStyle.modernHeaderSection}>
        <View style={InsightsPageStyle.headerContent}>
          <View style={InsightsPageStyle.titleContainer}>
            <Text style={InsightsPageStyle.modernPageTitle}>Food Library</Text>
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
                            <Text style={InsightsPageStyle.modernFoodCalories}>
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
  );
};

export default FoodInsightsScreen;
