import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Function to connect to MongoDB
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI; 
    if (!mongoURI) {
      throw new Error(
        "MongoDB connection string (MONGO_URI) is missing in environment variables"
      );
    }

    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); 
  }
};
