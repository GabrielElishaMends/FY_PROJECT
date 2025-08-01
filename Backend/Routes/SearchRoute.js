import express from 'express';
import { searchFood } from '../Controller/SearchController.js';

const router = express.Router();

router.get('/', searchFood);


export default router;
