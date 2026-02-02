import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { ConnectDB } from "./config/db.js";
import UserAuthRouter from "./routes/userRoutes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes/doctorRoutes.js";
import cors from "cors";
import adminRoutes from "./routes/adminRoutes/adminRoutes.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use("/uploads", express.static("uploads"));

await ConnectDB();

app.use("/api", UserAuthRouter);
app.use("/api", doctorRoutes);
app.use("/api", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
