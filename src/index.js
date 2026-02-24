import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { ConnectDB } from "./config/db.js";
import UserAuthRouter from "./routes/userRoutes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes/doctorRoutes.js";
import cors from "cors";
import adminRoutes from "./routes/adminRoutes/adminRoutes.js";
import cookieParser from "cookie-parser";
import appointmentRoutes from "./routes/appointmentRoutes/AppointmentRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

// CORS configuration for both development and production
const allowedOrigins = [
  "http://localhost:5173",
  "https://ddass.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use("/uploads", express.static("uploads"));

await ConnectDB();

app.get("/", (req, res) => {
  res.send("Welcome to the Doctor Appointment System API");
});
app.use("/api", UserAuthRouter);
app.use("/api", doctorRoutes);
app.use("/api", adminRoutes);
app.use("/api", appointmentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
