import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import InsightsPageStyle from '../styles/InsightPageStyles';
import axios from 'axios';
import {
  renderDigestiveTab,
  renderHealthTab,
  renderNutrientsTab,
} from '../../components/InsightTabs';
import { BackendLink } from '@/components/Default';
import { useLocalSearchParams } from 'expo-router';
import foodImages from '../../assets/foodImages/foodImages';

const getFoodImage = (name: string) => {
  if (!name) return null;
  const key = name.toLowerCase().replace(/_/g, ' ').trim();
  return foodImages[key] || foodImages[name.toLowerCase()];
};

const FoodDetailsScreen = () => {
  const { foodId } = useLocalSearchParams();
  const [foodDetails, setFoodDetails] = useState(null);
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

  const imageSource = getFoodImage(foodDetails?.name);

  return (
    <View style={{ flex: 1 }}>
      {foodDetails ? (
        <SafeAreaView style={InsightsPageStyle.safeContainer}>
          <View style={InsightsPageStyle.contain}>
            <Text style={InsightsPageStyle.pageTitle}>
              {foodDetails.name} Insight
            </Text>
            <Text style={InsightsPageStyle.pageSubtitle}>
              Learn about digestive properties and health benefits{' '}
            </Text>
          </View>
          <ScrollView>
            <View style={InsightsPageStyle.cont}>
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
                    benefits: foodDetails.benefits,
                    cautions: foodDetails.cautions,
                  })}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 10, color: '#555' }}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

export default FoodDetailsScreen;
