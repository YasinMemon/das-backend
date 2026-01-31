import mongoose from "mongoose";

export const ConnectDB = async () => {
  try {
    // console.log(`${process.env.MONGO_URI}`);
    await mongoose.connect(process.env.MONGO_URI);
    // console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  } finally {
    mongoose.set("strictQuery", false);
  }
};
