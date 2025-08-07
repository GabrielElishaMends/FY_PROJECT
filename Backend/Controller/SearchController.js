import Food from '../Models/FoodSchema.js';

export const searchFood = async (req, res) => {
  try {
    const { query } = req.query;

    // Case-insensitive search
    const food = await Food.findOne({
      name: { $regex: new RegExp(query, 'i') },
    });

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    // Extract nutrition values from nutrientBreakdown
    let carbs = 0;
    let protein = 0;
    let fat = 0;

    if (food.nutrientBreakdown && Array.isArray(food.nutrientBreakdown)) {
      food.nutrientBreakdown.forEach((nutrient) => {
        const nutrientName = nutrient.nutrient?.toLowerCase();
        const info = nutrient.info || '';

        // Extract only the first numeric value from info string (e.g., "34g (12% DV)" -> 34)
        const match = info.match(/^(\d+(?:\.\d+)?)/);
        const numericValue = match ? parseFloat(match[1]) : 0;

        if (nutrientName?.includes('carb')) {
          carbs = numericValue;
        } else if (nutrientName?.includes('protein')) {
          protein = numericValue;
        } else if (
          nutrientName?.includes('fat') &&
          !nutrientName?.includes('saturated')
        ) {
          // Total fat, not saturated fat
          fat = numericValue;
        }
      });
    }

    const foodDetails = {
      name: food.name,
      numCalories: food.numCalories,
      carbs: carbs, // Add extracted carbs
      protein: protein, // Add extracted protein
      fat: fat, // Add extracted fat
      digestionTime: food.digestionTime,
      timeToEat: food.timeToEat,
      digestionComplexity: food.digestionComplexity,
      additionalDigestionNotes: food.additionalDigestionNotes,
      benefits: food.benefits,
      cautions: food.cautions,
      nutrientBreakdown: food.nutrientBreakdown,
    };

    console.log('🔍 Backend - Extracted nutrition values for', food.name, ':', {
      carbs,
      protein,
      fat,
      extractionDetails: food.nutrientBreakdown?.map((nutrient) => ({
        nutrient: nutrient.nutrient,
        info: nutrient.info,
        extractedValue: nutrient.info?.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0',
      })),
    });

    res.status(200).json(foodDetails);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching for food' });
  }
};
