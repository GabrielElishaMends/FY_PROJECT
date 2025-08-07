// Top-ons nutritional data for protein additions
export interface TopOnItem {
  id: string;
  name: string;
  calories: number; // per 100g serving
  protein: number; // grams per 100g
  fats: number; // grams per 100g
  carbohydrates: number; // grams per 100g
  emoji: string; // for visual representation
}

export const TOP_ONS_DATA: TopOnItem[] = [
  {
    id: 'egg',
    name: 'Egg',
    calories: 72,
    protein: 6,
    fats: 5,
    carbohydrates: 1,
    emoji: '🥚',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    calories: 211,
    protein: 25.8,
    fats: 10,
    carbohydrates: 0,
    emoji: '🐔',
  },
  {
    id: 'fish',
    name: 'Fish',
    calories: 280,
    protein: 39.2,
    fats: 12.5,
    carbohydrates: 0,
    emoji: '🐟',
  },
  {
    id: 'cow_meat',
    name: 'Cow Meat',
    calories: 217,
    protein: 26.1,
    fats: 11.8,
    carbohydrates: 0,
    emoji: '🥩',
  },
  {
    id: 'wele',
    name: 'Wele (Cow Skin)',
    calories: 224.6,
    protein: 46.9,
    fats: 1.09,
    carbohydrates: 6.8,
    emoji: '🍖',
  },
  {
    id: 'snail',
    name: 'Snail',
    calories: 90,
    protein: 16.1,
    fats: 1.4,
    carbohydrates: 2.0,
    emoji: '🐌',
  },
  {
    id: 'sausage',
    name: 'Sausage',
    calories: 268,
    protein: 27,
    fats: 18,
    carbohydrates: 1.6,
    emoji: '🌭',
  },
  {
    id: 'crab',
    name: 'Crab',
    calories: 83,
    protein: 17.8,
    fats: 0.7,
    carbohydrates: 0,
    emoji: '🦀',
  },
  {
    id: 'goat_meat',
    name: 'Goat Meat',
    calories: 122,
    protein: 23,
    fats: 2.6,
    carbohydrates: 0,
    emoji: '🐐',
  },
  {
    id: 'pork',
    name: 'Pork',
    calories: 292,
    protein: 25.7,
    fats: 20.8,
    carbohydrates: 0,
    emoji: '🐷',
  },
  {
    id: 'gizzard',
    name: 'Gizzard',
    calories: 154,
    protein: 30.3,
    fats: 3.7,
    carbohydrates: 0,
    emoji: '🫀',
  },
  {
    id: 'liver',
    name: 'Liver',
    calories: 125,
    protein: 15.5,
    fats: 4,
    carbohydrates: 4.8,
    emoji: '🥓',
  },
];

// Helper interface for selected top-ons
export interface SelectedTopOn {
  id: string;
  name: string;
  quantity: number; // portions (each portion = ~50g)
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
}

// Helper function to calculate nutrition for a given quantity
export const calculateTopOnNutrition = (
  topOn: TopOnItem,
  quantity: number
): SelectedTopOn => {
  const portionSize = 50; // grams per portion
  const factor = (portionSize * quantity) / 100; // convert to 100g base

  return {
    id: topOn.id,
    name: topOn.name,
    quantity,
    totalCalories: Math.round(topOn.calories * factor),
    totalProtein: Math.round(topOn.protein * factor * 10) / 10,
    totalFats: Math.round(topOn.fats * factor * 10) / 10,
    totalCarbs: Math.round(topOn.carbohydrates * factor * 10) / 10,
  };
};

// Helper function to sum up all selected top-ons nutrition
export const sumTopOnsNutrition = (selectedTopOns: SelectedTopOn[]) => {
  const totals = selectedTopOns.reduce(
    (total, topOn) => ({
      calories: total.calories + topOn.totalCalories,
      protein: total.protein + topOn.totalProtein,
      fats: total.fats + topOn.totalFats,
      carbohydrates: total.carbohydrates + topOn.totalCarbs,
    }),
    { calories: 0, protein: 0, fats: 0, carbohydrates: 0 }
  );

  // Round all values to prevent floating point precision issues
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 100) / 100, // 2 decimal places max
    fats: Math.round(totals.fats * 100) / 100, // 2 decimal places max
    carbohydrates: Math.round(totals.carbohydrates * 100) / 100, // 2 decimal places max
  };
};
