import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import InsightsPageStyle from '../styles/InsightPageStyles';
import colors from '../config/colors';
import axios from 'axios';
import {
  renderDigestiveTab,
  renderHealthTab,
  renderNutrientsTab,
} from '../../components/InsightTabs';
import { BackendLink } from '@/components/Default';
import { useLocalSearchParams } from 'expo-router';
import foodImages from '../../assets/foodImages/foodImages';

interface FoodDetails {
  _id: string;
  name: string;
  numCalories: number;
  nutrientBreakdown?: any[];
  digestionTime?: string;
  timeToEat?: string;
  digestionComplexity?: string;
  additionalDigestionNotes?: string;
  benefits?: string[];
  cautions?: string[];
}

const getFoodImage = (name: string) => {
  if (!name) return null;
  const key = name.toLowerCase().replace(/_/g, ' ').trim();
  return foodImages[key] || foodImages[name.toLowerCase()];
};

const FoodDetailsScreen = () => {
  const { foodId } = useLocalSearchParams();
  const [foodDetails, setFoodDetails] = useState<FoodDetails | null>(null);
  const [activeTab, setActiveTab] = useState<
    'Digestive' | 'Health' | 'Nutrients'
  >('Nutrients'); // Changed default tab to 'Nutrients'

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const response = await axios.get(`${BackendLink}/food/${foodId}`);
        setFoodDetails(response.data);
      } catch (error) {
        console.error('Error fetching food details:', error);
      }
    };

    fetchFoodDetails();
  }, [foodId]);

  const imageSource = getFoodImage(foodDetails?.name || '');

  return (
    <View style={{ flex: 1 }}>
      {foodDetails ? (
        <SafeAreaView style={InsightsPageStyle.modernSafeContainer}>
          <StatusBar style="light" backgroundColor={colors.tertiary} />
          {/* Modern Header Section */}
          <View style={InsightsPageStyle.modernHeaderSection}>
            <View style={InsightsPageStyle.headerContent}>
              <View style={InsightsPageStyle.titleContainer}>
                <Text style={InsightsPageStyle.modernPageTitle}>
                  {foodDetails.name} Insights
                </Text>
                <Text style={InsightsPageStyle.modernPageSubtitle}>
                  Nutritional breakdown and health benefits
                </Text>
              </View>
              <View style={InsightsPageStyle.headerIconContainer}>
                <Feather name="pie-chart" size={24} color="#fff" />
              </View>
            </View>
          </View>

          <ScrollView
            style={InsightsPageStyle.modernScrollView}
            contentContainerStyle={InsightsPageStyle.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[InsightsPageStyle.cont, { marginTop: 20 }]}>
              <View style={InsightsPageStyle.headContainer}>
                <ImageBackground
                  source={imageSource}
                  style={InsightsPageStyle.headerImage}
                  imageStyle={InsightsPageStyle.headerImageStyle}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={InsightsPageStyle.gradientOverlay}
                  >
                    <Text style={InsightsPageStyle.foodName}>
                      {foodDetails.name}
                    </Text>
                    <Text style={InsightsPageStyle.foodCalories}>
                      {foodDetails.numCalories} kcal per serving
                    </Text>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* Tabs */}
              <View style={InsightsPageStyle.insightsContainer}>
                <View style={InsightsPageStyle.tabBar}>
                  {(['Nutrients', 'Digestive', 'Health'] as const).map(
                    (tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          InsightsPageStyle.tabItem,
                          activeTab === tab && InsightsPageStyle.activeTab,
                        ]}
                        onPress={() => setActiveTab(tab)}
                      >
                        <Text
                          style={[
                            InsightsPageStyle.tabText,
                            activeTab === tab &&
                              InsightsPageStyle.activeTabText,
                          ]}
                        >
                          {tab}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {/* Tab Content */}
                {activeTab === 'Nutrients' &&
                  renderNutrientsTab(
                    (foodDetails.nutrientBreakdown || []).map((n: any) => ({
                      label: n.nutrient,
                      value: n.info,
                      width: n.percentDailyValue
                        ? n.percentDailyValue.toString()
                        : '0',
                      color: n.color || '#6b7280',
                    }))
                  )}
                {activeTab === 'Digestive' &&
                  renderDigestiveTab({
                    foodName: foodDetails.name,
                    digestionTime: foodDetails.digestionTime,
                    timeToEat: foodDetails.timeToEat,
                    digestionComplexity: foodDetails.digestionComplexity,
                    additionalDigestionNotes:
                      foodDetails.additionalDigestionNotes,
                  })}
                {activeTab === 'Health' &&
                  renderHealthTab({
                    foodName: foodDetails.name,
                    benefits: foodDetails.benefits || [],
                    cautions: foodDetails.cautions || [],
                  } as any)}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      ) : (
        <View style={InsightsPageStyle.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tertiary} />
          <Text style={InsightsPageStyle.loadingText}>
            Loading food details...
          </Text>
        </View>
      )}
    </View>
  );
};

export default FoodDetailsScreen;
