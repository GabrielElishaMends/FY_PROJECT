import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { FoodItem, GHANAIAN_FOODS } from './foodData';
import { DailyNutritionNeeds, WeeklyNutritionNeeds } from './calculateCalories';

// Existing interfaces
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  age?: number;
  gender?: 'male' | 'female';
  height?: number; // cm
  weight?: number; // kg
  activityLevel?:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extra_active';
  dailyCalories?: number;
  dailyCarbs?: number;
  dailyProtein?: number;
  dailyFat?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodHistoryEntry {
  id: string;
  userId: string;
  food: FoodItem;
  portionMultiplier: number; // 1.0 = full portion, 0.5 = half, 2.0 = double
  timestamp: Date;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  foodCount: number;
  averageDailyCalories: number;
}

export const uploadImageAsync = async (uri: string, userId: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storage = getStorage();
  const imageRef = ref(storage, `users/${userId}/images/${Date.now()}.jpg`);
  await uploadBytes(imageRef, blob);
  const downloadURL = await getDownloadURL(imageRef);
  return downloadURL;
};

// Helper function to find food details by name (handles various name formats)
export const findFoodByName = (foodName: string): FoodItem | null => {
  if (!foodName) return null;

  console.log('🔍 Finding food by name:', foodName);

  // Normalize the input name
  const normalizedInput = foodName.toLowerCase().trim();

  // Direct match with food data
  const directMatch = GHANAIAN_FOODS.find(
    (food) =>
      food.name.toLowerCase() === normalizedInput ||
      food.id.toLowerCase() === normalizedInput
  );

  if (directMatch) {
    console.log('✅ Direct match found:', directMatch);
    return directMatch;
  }

  // Extended name mappings based on foodImages.ts and common variations
  const nameMap: { [key: string]: string } = {
    'fante kenkey': 'Fante Kenkey',
    kenkey: 'Fante Kenkey',
    'ga kenkey': 'Ga Kenkey',
    'plain rice': 'Plain Rice',
    rice: 'Plain Rice',
    'rice and stew': 'Plain Rice',
    'rice balls (omo tuo)': 'Rice Balls',
    'omo tuo': 'Rice Balls',
    'rice balls': 'Rice Balls',
    'etor (oto)': 'Etor',
    oto: 'Etor',
    'boiled plantain (ampesie)': 'Boiled Plantain',
    'plantain (ampesie)': 'Boiled Plantain',
    ampesie: 'Boiled Plantain',
    'jollof rice': 'Jollof Rice',
    'tuo zaafi': 'Tuo Zaafi',
    'tuo zaafi (tz)': 'Tuo Zaafi',
    tz: 'Tuo Zaafi',
    'boiled yam (ampesie)': 'Boiled Yam',
    'yam (ampesie)': 'Boiled Yam',
    'boiled yam': 'Boiled Yam',
    yam: 'Boiled Yam',
    gob3: 'Gobe',
    gobe: 'Gobe',
  };

  // Check mapped names
  const mappedName = nameMap[normalizedInput];
  if (mappedName) {
    console.log('🗂️ Found mapped name:', normalizedInput, '->', mappedName);
    const mappedMatch = GHANAIAN_FOODS.find(
      (food) => food.name.toLowerCase() === mappedName.toLowerCase()
    );
    if (mappedMatch) {
      console.log('✅ Mapped match found:', mappedMatch);
      return mappedMatch;
    }
  }

  // Partial match (contains the search term)
  const partialMatch = GHANAIAN_FOODS.find(
    (food) =>
      food.name.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(food.name.toLowerCase().replace(/\s+/g, ' '))
  );

  if (partialMatch) {
    console.log('🔎 Partial match found:', partialMatch);
    return partialMatch;
  }

  console.log('❌ No match found for:', foodName);
  console.log(
    'Available foods:',
    GHANAIAN_FOODS.map((f) => f.name)
  );
  return null;
};

export const saveFoodHistory = async ({
  userId,
  imageUri,
  foodName,
  calories,
  createdAt,
  portionMultiplier = 1,
}: {
  userId: string;
  imageUri: string | number | null;
  foodName: string;
  calories: string | number;
  createdAt: string;
  portionMultiplier?: number;
}) => {
  try {
    console.log('💾 Saving food history for:', foodName);

    // Find the food details from our local database
    const foodDetails = findFoodByName(foodName);
    console.log('🔍 Food lookup result:', foodDetails);

    let nutritionData = {
      calories:
        typeof calories === 'string' ? parseFloat(calories) || 0 : calories,
      carbs: 0,
      protein: 0,
      fat: 0,
    };

    // If we found the food in our database, use its nutrition data
    if (foodDetails) {
      nutritionData = {
        calories: foodDetails.calories * portionMultiplier,
        carbs: foodDetails.carbs * portionMultiplier,
        protein: foodDetails.protein * portionMultiplier,
        fat: foodDetails.fat * portionMultiplier,
      };
      console.log('✅ Using nutrition data from database:', nutritionData);
    } else {
      console.log(
        '⚠️ Food not found in database, using calories only:',
        nutritionData
      );
    }

    const historyData: any = {
      userId,
      imageUri: imageUri,
      name: foodName,
      calories: nutritionData.calories,
      carbs: nutritionData.carbs,
      protein: nutritionData.protein,
      fat: nutritionData.fat,
      portionMultiplier: portionMultiplier,
      createdAt: serverTimestamp(),
    };

    // Remove null values but keep empty strings and numbers
    Object.keys(historyData).forEach((key) => {
      if (historyData[key] === null || historyData[key] === undefined) {
        delete historyData[key];
      }
    });

    console.log('💾 Saving food history with nutrition data:', historyData);
    await addDoc(collection(db, 'history'), historyData);
  } catch (error) {
    console.error('Error saving food history:', error);
    throw new Error('Failed to save food history');
  }
};

// Add this function to check Firebase data
export const logFoodHistory = async (userId: string) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'history'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    );

    querySnapshot.forEach((doc) => {
      console.log('Latest Firebase Entry:', {
        id: doc.id,
        ...doc.data(),
      });
    });
  } catch (error) {
    console.error('Error fetching food history:', error);
  }
};

// New enhanced functions for nutrition tracking

// Save or update user profile with health info
export const saveUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData = {
      ...profileData,
      updatedAt: new Date(),
    };

    // If it's a new profile, add createdAt
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      updateData.createdAt = new Date();
    }

    await setDoc(userDocRef, updateData, { merge: true });
    console.log('User profile saved successfully');
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: userId,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Save food entry to history (new enhanced version)
export const saveFoodToHistory = async (
  userId: string,
  food: FoodItem,
  portionMultiplier: number = 1.0, // Default to full portion
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  notes?: string
) => {
  try {
    const foodHistoryRef = collection(db, 'foodHistory');
    const entryId = `${userId}_${Date.now()}`;

    const foodEntry: FoodHistoryEntry = {
      id: entryId,
      userId,
      food,
      portionMultiplier,
      timestamp: new Date(),
      mealType,
      notes,
    };

    await setDoc(doc(foodHistoryRef, entryId), foodEntry);
    console.log('Food entry saved to history');
    return entryId;
  } catch (error) {
    console.error('Error saving food to history:', error);
    throw error;
  }
};

// Get user's food history
export const getUserFoodHistory = async (
  userId: string,
  limitCount: number = 50,
  startDate?: Date,
  endDate?: Date
): Promise<FoodHistoryEntry[]> => {
  try {
    let q = query(
      collection(db, 'foodHistory'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (startDate && endDate) {
      q = query(
        collection(db, 'foodHistory'),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const foodHistory: FoodHistoryEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      foodHistory.push({
        ...data,
        timestamp: data.timestamp.toDate(),
      } as FoodHistoryEntry);
    });

    return foodHistory;
  } catch (error) {
    console.error('Error getting food history:', error);
    throw error;
  }
};

// Calculate daily nutrition totals from food history
export const calculateDailyTotals = (
  foodHistory: FoodHistoryEntry[],
  targetDate: Date
) => {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const dayEntries = foodHistory.filter(
    (entry) => entry.timestamp >= startOfDay && entry.timestamp <= endOfDay
  );

  return dayEntries.reduce(
    (totals, entry) => {
      const portionMultiplier = entry.portionMultiplier || 1.0;

      totals.calories += entry.food.calories * portionMultiplier;
      totals.carbs += entry.food.carbs * portionMultiplier;
      totals.protein += entry.food.protein * portionMultiplier;
      totals.fat += entry.food.fat * portionMultiplier;

      return totals;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
};

// Calculate weekly nutrition summary
export const calculateWeeklySummary = (
  foodHistory: FoodHistoryEntry[],
  weekStartDate: Date
): WeeklySummary => {
  const weekStart = new Date(weekStartDate);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekEntries = foodHistory.filter(
    (entry) => entry.timestamp >= weekStart && entry.timestamp <= weekEnd
  );

  const totals = weekEntries.reduce(
    (sum, entry) => {
      const portionMultiplier = entry.portionMultiplier || 1.0;

      sum.totalCalories += entry.food.calories * portionMultiplier;
      sum.totalCarbs += entry.food.carbs * portionMultiplier;
      sum.totalProtein += entry.food.protein * portionMultiplier;
      sum.totalFat += entry.food.fat * portionMultiplier;

      return sum;
    },
    { totalCalories: 0, totalCarbs: 0, totalProtein: 0, totalFat: 0 }
  );

  return {
    weekStart,
    weekEnd,
    ...totals,
    foodCount: weekEntries.length,
    averageDailyCalories: totals.totalCalories / 7,
  };
};

// Compare intake with daily needs
export const compareWithDailyNeeds = (
  actualIntake: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  },
  dailyNeeds: DailyNutritionNeeds
) => {
  return {
    caloriesPercentage: Math.round(
      (actualIntake.calories / dailyNeeds.dailyCalories) * 100
    ),
    carbsPercentage: Math.round(
      (actualIntake.carbs / dailyNeeds.dailyCarbs) * 100
    ),
    proteinPercentage: Math.round(
      (actualIntake.protein / dailyNeeds.dailyProtein) * 100
    ),
    fatPercentage: Math.round((actualIntake.fat / dailyNeeds.dailyFat) * 100),
  };
};

// Compare intake with weekly needs
export const compareWithWeeklyNeeds = (
  weeklySummary: WeeklySummary,
  weeklyNeeds: WeeklyNutritionNeeds
) => {
  return {
    caloriesPercentage: Math.round(
      (weeklySummary.totalCalories / weeklyNeeds.weeklyCalories) * 100
    ),
    carbsPercentage: Math.round(
      (weeklySummary.totalCarbs / weeklyNeeds.weeklyCarbs) * 100
    ),
    proteinPercentage: Math.round(
      (weeklySummary.totalProtein / weeklyNeeds.weeklyProtein) * 100
    ),
    fatPercentage: Math.round(
      (weeklySummary.totalFat / weeklyNeeds.weeklyFat) * 100
    ),
  };
};

// Get daily nutrition totals from Firebase history
export const getDailyNutritionTotals = async (userId: string, date?: Date) => {
  try {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'history'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      )
    );

    let totals = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      foodCount: 0,
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totals.calories += data.calories || 0;
      totals.carbs += data.carbs || 0;
      totals.protein += data.protein || 0;
      totals.fat += data.fat || 0;
      totals.foodCount += 1;
    });

    return totals;
  } catch (error) {
    console.error('Error getting daily nutrition totals:', error);
    return { calories: 0, carbs: 0, protein: 0, fat: 0, foodCount: 0 };
  }
};

// Get weekly nutrition totals from Firebase history
export const getWeeklyNutritionTotals = async (
  userId: string,
  startDate?: Date
) => {
  try {
    const weekStart = startDate || new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'history'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(weekStart)),
        where('createdAt', '<=', Timestamp.fromDate(weekEnd))
      )
    );

    let totals = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      foodCount: 0,
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totals.calories += data.calories || 0;
      totals.carbs += data.carbs || 0;
      totals.protein += data.protein || 0;
      totals.fat += data.fat || 0;
      totals.foodCount += 1;
    });

    return totals;
  } catch (error) {
    console.error('Error getting weekly nutrition totals:', error);
    return { calories: 0, carbs: 0, protein: 0, fat: 0, foodCount: 0 };
  }
};

// Get nutrition history for a date range (useful for charts/graphs)
export const getNutritionHistory = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'history'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      )
    );

    const history: any[] = [];
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

    return history;
  } catch (error) {
    console.error('Error getting nutrition history:', error);
    return [];
  }
};
