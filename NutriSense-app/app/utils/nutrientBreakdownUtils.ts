// Helper functions for updating nutrient breakdown with top-ons
export interface NutrientBreakdownItem {
  nutrient?: string;
  info?: string;
  color?: string;
  percentDailyValue?: number;
}

export interface TopOnsNutrition {
  calories: number;
  protein: number;
  fats: number;
  carbohydrates: number;
}

// User's personalized daily nutrition needs
export interface PersonalizedDailyValues {
  protein: number; // grams
  carbohydrates: number; // grams
  fats: number; // grams
}

// Default Daily Value constants (FDA guidelines for 2000 calorie diet) - used as fallback
export const DEFAULT_DAILY_VALUES = {
  protein: 50, // grams
  carbohydrates: 300, // grams
  fats: 65, // grams
};

// Helper function to extract numeric value from info string like "7g (9% DV)"
export const extractNutrientGrams = (infoString?: string): number => {
  if (!infoString) return 0;

  // Match patterns like "7g", "15.5g", "0.5g"
  const match = infoString.match(/(\d+\.?\d*)g/);
  return match ? parseFloat(match[1]) : 0;
};

// Helper function to calculate percentage daily value with personalized or default values
export const calculatePercentDV = (
  grams: number,
  nutrient: 'protein' | 'carbohydrates' | 'fats',
  personalizedValues?: PersonalizedDailyValues
): number => {
  let dailyValue: number;

  if (personalizedValues) {
    dailyValue = personalizedValues[nutrient];
  } else {
    dailyValue = DEFAULT_DAILY_VALUES[nutrient];
  }

  return Math.round((grams / dailyValue) * 100);
};

// Helper function to format nutrient info string with personalized or default values
export const formatNutrientInfo = (
  grams: number,
  nutrient: 'protein' | 'carbohydrates' | 'fats',
  personalizedValues?: PersonalizedDailyValues
): string => {
  const percentDV = calculatePercentDV(grams, nutrient, personalizedValues);
  return `${grams.toFixed(1)}g (${percentDV}% DV)`;
};

// Main function to update nutrient breakdown with top-ons using personalized daily values
export const updateNutrientBreakdownWithTopOns = (
  nutrientBreakdown: NutrientBreakdownItem[],
  topOnsNutrition: TopOnsNutrition,
  personalizedValues?: PersonalizedDailyValues
): NutrientBreakdownItem[] => {
  if (!nutrientBreakdown || !Array.isArray(nutrientBreakdown)) {
    return nutrientBreakdown;
  }

  return nutrientBreakdown.map((item) => {
    const nutrientName = item.nutrient?.toLowerCase();

    if (nutrientName === 'protein') {
      const currentGrams = extractNutrientGrams(item.info);
      const newTotalGrams = currentGrams + topOnsNutrition.protein;

      return {
        ...item,
        info: formatNutrientInfo(newTotalGrams, 'protein', personalizedValues),
        percentDailyValue: calculatePercentDV(
          newTotalGrams,
          'protein',
          personalizedValues
        ),
      };
    }

    if (nutrientName === 'fat' || nutrientName === 'fats') {
      const currentGrams = extractNutrientGrams(item.info);
      const newTotalGrams = currentGrams + topOnsNutrition.fats;

      return {
        ...item,
        info: formatNutrientInfo(newTotalGrams, 'fats', personalizedValues),
        percentDailyValue: calculatePercentDV(
          newTotalGrams,
          'fats',
          personalizedValues
        ),
      };
    }

    if (
      nutrientName === 'carbohydrate' ||
      nutrientName === 'carbohydrates' ||
      nutrientName === 'carbs'
    ) {
      const currentGrams = extractNutrientGrams(item.info);
      const newTotalGrams = currentGrams + topOnsNutrition.carbohydrates;

      return {
        ...item,
        info: formatNutrientInfo(
          newTotalGrams,
          'carbohydrates',
          personalizedValues
        ),
        percentDailyValue: calculatePercentDV(
          newTotalGrams,
          'carbohydrates',
          personalizedValues
        ),
      };
    }

    // Return unchanged for other nutrients
    return item;
  });
};
