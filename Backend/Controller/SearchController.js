import Food from '../Models/FoodSchema.js';

export const searchFood = async (req, res) => {
  try {
    const { query } = req.query;

    // Improved search with ranking system
    let food = null;
    const searchTerm = query.toLowerCase().trim();

    // Priority 1: Exact match on main name (case-insensitive)
    food = await Food.findOne({
      name: { $regex: new RegExp(`^${query}$`, 'i') },
    });

    if (!food) {
      // Priority 2: Find all foods that match in name or otherNames
      const matchingFoods = await Food.find({
        $or: [
          { name: { $regex: new RegExp(query, 'i') } },
          { 'otherNames.name': { $regex: new RegExp(query, 'i') } },
        ],
      });

      if (matchingFoods.length > 0) {
        // Rank the results for better matching
        const rankedFoods = matchingFoods.map((foodItem) => {
          let score = 0;
          const foodName = foodItem.name.toLowerCase();

          // Higher score for exact matches
          if (foodName === searchTerm) {
            score += 100;
          }
          // Higher score for names that start with the search term
          else if (foodName.startsWith(searchTerm)) {
            score += 50;
          }
          // Higher score for shorter names (more specific)
          score += Math.max(0, 20 - foodName.length);

          // Check otherNames for matches
          if (foodItem.otherNames && foodItem.otherNames.length > 0) {
            foodItem.otherNames.forEach((otherName) => {
              const otherNameLower = otherName.name.toLowerCase();
              if (otherNameLower === searchTerm) {
                score += 80; // High score for exact match in otherNames
              } else if (otherNameLower.includes(searchTerm)) {
                score += 30; // Medium score for partial match in otherNames
              }
            });
          }

          return { food: foodItem, score };
        });

        // Sort by score (highest first) and pick the best match
        rankedFoods.sort((a, b) => b.score - a.score);
        food = rankedFoods[0].food;

        console.log('🔍 Search ranking for query:', query, {
          totalMatches: rankedFoods.length,
          selectedFood: food.name,
          rankings: rankedFoods.slice(0, 3).map((r) => ({
            name: r.food.name,
            score: r.score,
          })),
        });
      }
    }

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
