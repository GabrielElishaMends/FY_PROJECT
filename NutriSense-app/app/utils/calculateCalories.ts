// Mifflin-St Jeor Equation for calculating daily calorie needs
export interface UserHealthInfo {
  age: number;
  gender: 'male' | 'female';
  height: number; // in cm
  weight: number; // in kg
  activityLevel:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extra_active';
}

export interface DailyNutritionNeeds {
  dailyCalories: number;
  dailyCarbs: number; // in grams
  dailyProtein: number; // in grams
  dailyFat: number; // in grams
}

export interface WeeklyNutritionNeeds {
  weeklyCalories: number;
  weeklyCarbs: number;
  weeklyProtein: number;
  weeklyFat: number;
}

// Activity level multipliers
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Little or no exercise
  lightly_active: 1.375, // Light exercise/sports 1-3 days/week
  moderately_active: 1.55, // Moderate exercise/sports 3-5 days/week
  very_active: 1.725, // Hard exercise/sports 6-7 days a week
  extra_active: 1.9, // Very hard exercise/sports & physical job
};

export const calculateDailyCalories = (userInfo: UserHealthInfo): number => {
  const { age, gender, height, weight, activityLevel } = userInfo;

  // Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Apply activity level multiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * activityMultiplier);
};

export const calculateMacronutrients = (
  dailyCalories: number
): DailyNutritionNeeds => {
  // Standard macronutrient distribution
  const carbsPercentage = 0.5; // 50% of calories from carbs
  const proteinPercentage = 0.2; // 20% of calories from protein
  const fatPercentage = 0.3; // 30% of calories from fat

  // Calculate grams (1g carbs = 4 calories, 1g protein = 4 calories, 1g fat = 9 calories)
  const dailyCarbs = Math.round((dailyCalories * carbsPercentage) / 4);
  const dailyProtein = Math.round((dailyCalories * proteinPercentage) / 4);
  const dailyFat = Math.round((dailyCalories * fatPercentage) / 9);

  return {
    dailyCalories,
    dailyCarbs,
    dailyProtein,
    dailyFat,
  };
};

export const calculateWeeklyNeeds = (
  dailyNeeds: DailyNutritionNeeds
): WeeklyNutritionNeeds => {
  return {
    weeklyCalories: dailyNeeds.dailyCalories * 7,
    weeklyCarbs: dailyNeeds.dailyCarbs * 7,
    weeklyProtein: dailyNeeds.dailyProtein * 7,
    weeklyFat: dailyNeeds.dailyFat * 7,
  };
};

// Helper function for height/weight suggestions based on age groups
export const getHeightSuggestions = (
  age: number
): { min: number; max: number; unit: string } => {
  if (age < 13) {
    return { min: 120, max: 160, unit: 'cm' }; // Children
  } else if (age < 18) {
    return { min: 150, max: 180, unit: 'cm' }; // Teens
  } else {
    return { min: 150, max: 200, unit: 'cm' }; // Adults
  }
};

export const getWeightSuggestions = (
  age: number
): { min: number; max: number; unit: string } => {
  if (age < 13) {
    return { min: 25, max: 60, unit: 'kg' }; // Children
  } else if (age < 18) {
    return { min: 40, max: 90, unit: 'kg' }; // Teens
  } else {
    return { min: 45, max: 120, unit: 'kg' }; // Adults
  }
};
