import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import foodRoutes from './Routes/FoodRoutes.js';
import searchRoutes from "./Routes/SearchRoute.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', 'exp://10.132.218.1:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use('/food', foodRoutes);
app.use("/search", searchRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
