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

    const foodDetails = {
      name: food.name,
      numCalories: food.numCalories,
      digestionTime: food.digestionTime,
      timeToEat: food.timeToEat,
      digestionComplexity: food.digestionComplexity,
      additionalDigestionNotes: food.additionalDigestionNotes,
      benefits: food.benefits,
      cautions: food.cautions,
      nutrientBreakdown: food.nutrientBreakdown,
    };

    res.status(200).json(foodDetails);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching for food' });
  }
};
