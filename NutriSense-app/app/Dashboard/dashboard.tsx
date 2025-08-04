import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getUserProfile,
  getUserFoodHistory,
  calculateDailyTotals,
  calculateWeeklySummary,
  UserProfile,
  FoodHistoryEntry,
  compareWithDailyNeeds,
  compareWithWeeklyNeeds,
} from '../utils/firebaseFoodUtils';
import { calculateWeeklyNeeds } from '../utils/calculateCalories';
import colors from '../config/colors';
import NutriHeader from '../homePage/NutriHeader';

const { width: screenWidth } = Dimensions.get('window');

interface NutritionTargets {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface CircularProgressProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  color?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  label,
  unit,
  size = 80, // Reduced default size
  color = colors.tertiary,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <View style={styles.svgContainer}>
        {/* Background circle */}
        <View
          style={[styles.backgroundCircle, { width: size, height: size }]}
        />

        {/* Progress overlay - always show color, even for 0 */}
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderColor: color, // Always use the provided color
              borderWidth: percentage > 0 ? 5 : 2, // Thinner border for 0 values
              opacity: percentage > 0 ? 1 : 0.3, // Semi-transparent for 0 values
            },
          ]}
        />

        {/* Values centered in the circle */}
        <View style={[styles.progressContent, { width: size, height: size }]}>
          <Text style={styles.progressValue}>{Math.round(value)}</Text>
          <Text style={styles.progressMax}>/ {max}</Text>
        </View>
      </View>

      {/* Labels below the circle */}
      <View style={styles.progressLabel}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
};

const DashboardScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [foodHistory, setFoodHistory] = useState<FoodHistoryEntry[]>([]);
  const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user profile
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);

          if (profile?.profileImage) {
            setProfileImage(profile.profileImage);
          }

          // Fetch food history
          const history = await getUserFoodHistory(user.uid, 100);
          setFoodHistory(history);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const nutritionData = useMemo(() => {
    if (!foodHistory.length) {
      return { calories: 0, carbs: 0, protein: 0, fat: 0 };
    }

    const now = new Date();

    if (viewType === 'daily') {
      return calculateDailyTotals(foodHistory, now);
    } else {
      // Calculate weekly summary
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      const weeklySummary = calculateWeeklySummary(foodHistory, weekStart);

      return {
        calories: weeklySummary.totalCalories,
        carbs: weeklySummary.totalCarbs,
        protein: weeklySummary.totalProtein,
        fat: weeklySummary.totalFat,
      };
    }
  }, [foodHistory, viewType]);

  const targets: NutritionTargets = useMemo(() => {
    if (!userProfile) {
      return { calories: 2000, carbs: 250, protein: 150, fat: 67 };
    }

    if (viewType === 'daily') {
      return {
        calories: userProfile.dailyCalories || 2000,
        carbs: userProfile.dailyCarbs || 250,
        protein: userProfile.dailyProtein || 150,
        fat: userProfile.dailyFat || 67,
      };
    } else {
      // Weekly targets
      const dailyNeeds = {
        dailyCalories: userProfile.dailyCalories || 2000,
        dailyCarbs: userProfile.dailyCarbs || 250,
        dailyProtein: userProfile.dailyProtein || 150,
        dailyFat: userProfile.dailyFat || 67,
      };
      const weeklyNeeds = calculateWeeklyNeeds(dailyNeeds);

      return {
        calories: weeklyNeeds.weeklyCalories,
        carbs: weeklyNeeds.weeklyCarbs,
        protein: weeklyNeeds.weeklyProtein,
        fat: weeklyNeeds.weeklyFat,
      };
    }
  }, [userProfile, viewType]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <NutriHeader profileImage={profileImage} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>
            Nutri<Text style={styles.titleAccent}>Sense</Text> Dashboard
          </Text>
          <Text style={styles.subtitle}>
            Track your {viewType} nutrition progress
          </Text>
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewType === 'daily' && styles.toggleButtonActive,
              ]}
              onPress={() => setViewType('daily')}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={viewType === 'daily' ? '#fff' : colors.tertiary}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewType === 'daily' && styles.toggleTextActive,
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewType === 'weekly' && styles.toggleButtonActive,
              ]}
              onPress={() => setViewType('weekly')}
            >
              <Ionicons
                name="stats-chart"
                size={16}
                color={viewType === 'weekly' ? '#fff' : colors.tertiary}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewType === 'weekly' && styles.toggleTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutrition Progress Cards */}
        <View style={styles.progressGrid}>
          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.calories}
              max={targets.calories}
              label="Calories"
              unit="kcal"
              color="#e91e63"
            />
          </View>

          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.carbs}
              max={targets.carbs}
              label="Carbs"
              unit="g"
              color="#ff9800"
            />
          </View>

          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.protein}
              max={targets.protein}
              label="Protein"
              unit="g"
              color="#4caf50"
            />
          </View>

          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.fat}
              max={targets.fat}
              label="Fat"
              unit="g"
              color="#2196f3"
            />
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="stats-chart" size={20} color={colors.tertiary} />
            <Text style={styles.summaryTitle}>
              {viewType === 'daily' ? "Today's" : "This Week's"} Summary
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round(nutritionData.calories)}
              </Text>
              <Text style={styles.summaryLabel}>Calories consumed</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round(nutritionData.carbs)}g
              </Text>
              <Text style={styles.summaryLabel}>Carbohydrates</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round(nutritionData.protein)}g
              </Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round(nutritionData.fat)}g
              </Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            <Text style={styles.summaryFooterText}>
              {foodHistory.length === 0
                ? 'Start tracking your food to see your nutrition progress!'
                : `Based on ${foodHistory.length} tracked food${
                    foodHistory.length === 1 ? '' : 's'
                  }`}
            </Text>
          </View>
        </View>

        {/* Additional spacing at bottom */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  titleAccent: {
    color: colors.tertiary,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    // backgroundColor: '#f0f0f0',
    borderRadius: 15,
    padding: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.tertiary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.tertiary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20, // More space between rows
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 160, // Increased height to contain all content
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    width: '100%',
    height: '100%',
    paddingTop: 5, // Reduced padding to keep content in bounds
  },
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80, // Slightly smaller circle
    height: 80,
  },
  backgroundCircle: {
    borderRadius: 40, // Adjusted for smaller circle
    borderWidth: 5,
    borderColor: '#f0f0f0',
    position: 'absolute',
  },
  progressCircle: {
    borderRadius: 40, // Adjusted for smaller circle
    borderWidth: 5,
    borderColor: colors.tertiary,
    position: 'absolute',
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 80, // Match circle size
    height: 80,
  },
  progressValue: {
    fontSize: 14, // Slightly smaller text
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  progressMax: {
    fontSize: 9, // Smaller text
    color: '#666',
    textAlign: 'center',
  },
  progressLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12, // Reduced margin
    paddingHorizontal: 4,
    flex: 1, // Take remaining space
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  unitText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.tertiary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  summaryFooterText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
