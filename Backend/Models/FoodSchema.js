import mongoose from 'mongoose';

const BenefitsSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  info: {
    type: String,
  },
});

const OtherNamesSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

const CautionsSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  info: {
    type: String,
  },
});

const NutrientBreakdownSchema = new mongoose.Schema({
  nutrient: {
    type: String,
  },
  info: {
    type: String,
  },
  color: {
    type: String,
  },
  percentDailyValue: {
    type: Number,
  },
});

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    numCalories: {
      type: String,
      required: true,
    },
    digestionTime: {
      type: String,
      required: true,
    },
    timeToEat: {
      type: String,
      required: true,
    },
    digestionComplexity: {
      type: String,
      required: true,
    },
    additionalDigestionNotes: {
      type: String,
      required: true,
    },
    benefits: [BenefitsSchema],
    otherNames: [OtherNamesSchema],
    cautions: [CautionsSchema],
    nutrientBreakdown: [NutrientBreakdownSchema],
  },
  { timestamps: true }
);

const Food = mongoose.model('Food', foodSchema);

export default Food;
