import React, { useState, useEffect } from 'react';
import {
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
import { BackendLink } from '@/components/Default';
import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import foodImages from '../../assets/foodImages/foodImages';

type TabName = 'Digestive' | 'Health' | 'Nutrients';

// type NutrientItem = {
//   label: string;
//   value: string;
//   width: string;
//   color: string;
// };

const FoodInsightsScreen: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('Digestive');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // const handleTabPress = (tabName: TabName) => {
  //   setActiveTab(tabName);
  // };

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

  // if (loading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Text>Loading...</Text>
  //     </View>
  //   );
  // }

  return (
    <SafeAreaView style={InsightsPageStyle.safeContainer}>
      <View style={InsightsPageStyle.contain}>
        <Text style={InsightsPageStyle.pageTitle}>Food Insights</Text>
        <Text style={InsightsPageStyle.pageSubtitle}>
          Learn about digestive properties and health benefits{' '}
        </Text>
      </View>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 10, color: '#555' }}>Loading...</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={InsightsPageStyle.container}>
            {foods.map((food) => {
              const imageSource = getFoodImage(food.name);

              return (
                <View key={food._id}>
                  <View style={InsightsPageStyle.headerContainer}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/insightsPage/FoodDetailsScreen',
                          params: { foodId: food._id },
                        })
                      }
                    >
                      <ImageBackground
                        source={imageSource}
                        style={InsightsPageStyle.headerImage}
                        imageStyle={{
                          borderRadius: 10,
                        }}
                      >
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.6)']}
                          style={InsightsPageStyle.gradientOverlay}
                        >
                          <Text style={InsightsPageStyle.foodName}>
                            {food.name}
                          </Text>
                          <Text style={InsightsPageStyle.foodCalories}>
                            {food.numCalories} calories per serving
                          </Text>
                        </LinearGradient>
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default FoodInsightsScreen;
