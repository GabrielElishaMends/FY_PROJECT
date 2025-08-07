export interface FoodItem {
  id: string;
  name: string;
  calories: number; // per 100g serving
  carbs: number; // grams
  protein: number; // grams
  fat: number; // grams
}

export const GHANAIAN_FOODS: FoodItem[] = [
  {
    id: 'waakye',
    name: 'Waakye',
    calories: 380,
    carbs: 78,
    protein: 15,
    fat: 7,
  },
  {
    id: 'banku',
    name: 'Banku',
    calories: 353,
    carbs: 82.4,
    protein: 7.1,
    fat: 1.2,
  },
  {
    id: 'fufu',
    name: 'Fufu',
    calories: 392,
    carbs: 81,
    protein: 2.7,
    fat: 8,
  },
  {
    id: 'jollof',
    name: 'Jollof Rice',
    calories: 285,
    carbs: 34,
    protein: 13,
    fat: 11,
  },
  {
    id: 'kelewele',
    name: 'Kelewele',
    calories: 38,
    carbs: 10,
    protein: 0,
    fat: 0.2,
  },
  {
    id: 'ga_kenkey',
    name: 'Ga Kenkey',
    calories: 400,
    carbs: 85,
    protein: 12,
    fat: 6,
  },
  {
    id: 'fante_kenkey',
    name: 'Fante Kenkey',
    calories: 190,
    carbs: 54,
    protein: 6,
    fat: 2,
  },
  {
    id: 'kokonte',
    name: 'Kokonte',
    calories: 350,
    carbs: 80,
    protein: 2,
    fat: 0,
  },
  {
    id: 'tuo_zaafi',
    name: 'Tuo Zaafi',
    calories: 130,
    carbs: 23,
    protein: 2.5,
    fat: 3,
  },
  {
    id: 'plantain',
    name: 'Boiled Plantain',
    calories: 250,
    carbs: 75,
    protein: 1.9,
    fat: 0.4,
  },
  {
    id: 'yam',
    name: 'Boiled Yam',
    calories: 133,
    carbs: 33,
    protein: 1.7,
    fat: 0.3,
  },
  {
    id: 'gobe',
    name: 'Gobe',
    calories: 190,
    carbs: 35,
    protein: 7,
    fat: 3,
  },
  {
    id: 'rice_balls',
    name: 'Rice Balls',
    calories: 165,
    carbs: 36,
    protein: 3,
    fat: 1,
  },
  {
    id: 'plain_rice',
    name: 'Plain Rice',
    calories: 130,
    carbs: 28,
    protein: 2.7,
    fat: 0.3,
  },
  {
    id: 'etor',
    name: 'Etor',
    calories: 200,
    carbs: 30,
    protein: 8,
    fat: 6,
  },
];

export const getFoodById = (id: string): FoodItem | undefined => {
  return GHANAIAN_FOODS.find((food) => food.id === id);
};

export const getFoodByName = (name: string): FoodItem | undefined => {
  return GHANAIAN_FOODS.find((food) =>
    food.name.toLowerCase().includes(name.toLowerCase())
  );
};

export const searchFoods = (query: string): FoodItem[] => {
  return GHANAIAN_FOODS.filter((food) =>
    food.name.toLowerCase().includes(query.toLowerCase())
  );
};
