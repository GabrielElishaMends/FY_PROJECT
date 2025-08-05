import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
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
  isLoading?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  label,
  unit,
  size = 80,
  color = colors.tertiary,
  isLoading = false,
}) => {
  const percentage = Math.max(0, (value / max) * 100);
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Calculate stroke dash offset for the progress
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <View style={styles.svgContainer}>
        {/* SVG Progress Circle */}
        <Svg width={size} height={size} style={styles.svgProgress}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Circle */}
          {!isLoading && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`} // Start from top
            />
          )}
        </Svg>

        {/* Values centered in the circle */}
        <View style={[styles.progressContent, { width: size, height: size }]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <>
              <Text style={styles.progressValue}>{Math.round(value)}</Text>
              <Text style={styles.progressMax}>/ {max}</Text>
            </>
          )}
        </View>
      </View>

      {/* Percentage below the circle, above the labels */}
      {!isLoading && (
        <View style={styles.progressPercentContainer}>
          <Text style={[styles.progressPercent, { color }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}

      {/* Labels below the percentage */}
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
  const [dataLoading, setDataLoading] = useState(true); // Renamed for clarity
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
          setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Auto-refresh nutrition data when date changes (daily/weekly reset)
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-calculation at midnight for daily reset
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Trigger re-render by updating a timestamp
        setDataLoading(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, []);

  const nutritionData = useMemo(() => {
    if (!foodHistory.length) {
      return { calories: 0, carbs: 0, protein: 0, fat: 0 };
    }

    const now = new Date();

    if (viewType === 'daily') {
      // Calculate daily totals for today - automatically resets at midnight
      // Uses date filtering: startOfDay (00:00:00) to endOfDay (23:59:59)
      return calculateDailyTotals(foodHistory, now);
    } else {
      // Calculate weekly summary - automatically resets each Monday
      const weekStart = new Date(now);
      // Set to Monday of current week (1 = Monday, 0 = Sunday)
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday as day 0
      weekStart.setDate(now.getDate() + daysToMonday);

      const weeklySummary = calculateWeeklySummary(foodHistory, weekStart);

      return {
        calories: weeklySummary.totalCalories,
        carbs: weeklySummary.totalCarbs,
        protein: weeklySummary.totalProtein,
        fat: weeklySummary.totalFat,
      };
    }
  }, [foodHistory, viewType, dataLoading]); // Include dataLoading to trigger refresh

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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" backgroundColor={colors.secondary} />
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
              isLoading={dataLoading}
            />
          </View>

          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.carbs}
              max={targets.carbs}
              label="Carbs"
              unit="g"
              color="#ff9800"
              isLoading={dataLoading}
            />
          </View>

          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.protein}
              max={targets.protein}
              label="Protein"
              unit="g"
              color="#4caf50"
              isLoading={dataLoading}
            />
          </View>

          <View style={styles.progressCard}>
            <CircularProgress
              value={nutritionData.fat}
              max={targets.fat}
              label="Fat"
              unit="g"
              color="#2196f3"
              isLoading={dataLoading}
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
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.tertiary} />
              ) : (
                <Text style={styles.summaryValue}>
                  {Math.round(nutritionData.calories)}
                </Text>
              )}
              <Text style={styles.summaryLabel}>Calories consumed</Text>
            </View>

            <View style={styles.summaryItem}>
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.tertiary} />
              ) : (
                <Text style={styles.summaryValue}>
                  {Math.round(nutritionData.carbs)}g
                </Text>
              )}
              <Text style={styles.summaryLabel}>Carbohydrates</Text>
            </View>

            <View style={styles.summaryItem}>
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.tertiary} />
              ) : (
                <Text style={styles.summaryValue}>
                  {Math.round(nutritionData.protein)}g
                </Text>
              )}
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>

            <View style={styles.summaryItem}>
              {dataLoading ? (
                <ActivityIndicator size="small" color={colors.tertiary} />
              ) : (
                <Text style={styles.summaryValue}>
                  {Math.round(nutritionData.fat)}g
                </Text>
              )}
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            {dataLoading ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={colors.tertiary} />
                <Text style={styles.summaryFooterText}>
                  Loading your nutrition data...
                </Text>
              </View>
            ) : (
              <Text style={styles.summaryFooterText}>
                {foodHistory.length === 0
                  ? 'Start tracking your food to see your nutrition progress!'
                  : `Based on ${foodHistory.length} tracked food${
                      foodHistory.length === 1 ? '' : 's'
                    }`}
              </Text>
            )}
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
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
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
    borderRadius: 15,
    padding: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.tertiary,
    elevation: 1,
    shadowColor: colors.tertiary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleText: {
    fontSize: 15,
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
    padding: 12, // Reduced padding for more internal space
    marginBottom: 20, // More space between rows
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 180, // Keep height but optimize internal spacing
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    width: '100%',
    height: '100%',
    paddingTop: 0, // Remove top padding to move everything up
    paddingBottom: 8, // Add bottom padding to ensure content doesn't get cut
  },
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    marginBottom: 3, // Reduced margin below circle
  },
  svgProgress: {
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
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  progressMax: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 12,
  },
  progressPercentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6, // Reduced space between circle and percentage
    marginBottom: 4, // Reduced space before labels
  },
  progressPercent: {
    fontSize: 11, // Slightly smaller to fit better
    textAlign: 'center',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6, // Reduced horizontal padding
    paddingVertical: 2, // Reduced vertical padding
    borderRadius: 8, // Smaller border radius
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2, // Added vertical padding for consistent spacing
    minHeight: 35, // Reduced minimum height but ensures space
  },
  labelText: {
    fontSize: 13, // Slightly smaller for better fit
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 1, // Small margin between label and unit
  },
  unitText: {
    fontSize: 11, // Slightly smaller unit text
    color: '#666',
    textAlign: 'center',
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
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  summaryFooterText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
