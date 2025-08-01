import Food from '../Models/FoodSchema.js';

export const getAllFood = async (req, res) => {
  try {
    const food = await Food.find();
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food data' });
  }
};

export const getFood = async (req, res) => {
  const { id } = req.params;

  try {
    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food data' });
  }
};

export const updateFood = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    numCalories,
    digestionTime,
    timeToEat,
    digestionComplexity,
    additionalDigestionNotes,
    foodType,
    benefits,
    otherNames,
    cautions,
    nutrientBreakdown,
  } = req.body;

  try {
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      {
        name,
        numCalories,
        digestionTime,
        timeToEat,
        digestionComplexity,
        additionalDigestionNotes,
        foodType,
        benefits,
        otherNames,
        cautions,
        nutrientBreakdown,
      },
      { new: true }
    );

    if (!updatedFood) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.status(200).json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: 'Error updating food data' });
  }
};

export const postFood = async (req, res) => {
  const {
    name,
    numCalories,
    digestionTime,
    timeToEat,
    digestionComplexity,
    additionalDigestionNotes,
    benefits,
    otherNames,
    cautions,
    nutrientBreakdown,
  } = req.body;

  if (
    !name ||
    !numCalories ||
    !digestionTime ||
    !timeToEat ||
    !digestionComplexity ||
    !additionalDigestionNotes
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newFood = new Food({
      name,
      numCalories,
      digestionTime,
      timeToEat,
      digestionComplexity,
      additionalDigestionNotes,
      benefits,
      otherNames,
      cautions,
      nutrientBreakdown,
    });

    await newFood.save();
    res.status(201).json(newFood);
  } catch (error) {
    res.status(500).json({ message: 'Error creating food item' });
  }
};


