import mongoose from "mongoose";
import dotenv from "dotenv";
import adminModel from "../src/models/adminModel.js";

dotenv.config({ path: "../.env" }); // 🔥 THIS WAS MISSING

await mongoose.connect(process.env.MONGO_URI);

await adminModel.create({
  username: "doctor",
  password: "password",
});

console.log("Admin created successfully");
process.exit();
