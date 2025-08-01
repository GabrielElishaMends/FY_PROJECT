import express from 'express';
import {
  getAllFood,
  getFood,
  updateFood,
  postFood,
} from '../Controller/FoodController.js';

const router = express.Router();

router.get('/', getAllFood);
router.get('/:id', getFood);
router.put('/:id', updateFood);
router.post('/', postFood);

export default router;
