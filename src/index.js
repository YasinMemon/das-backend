import express from "express";
import { ConnectDB } from "./config/db.js";
import dotenv from "dotenv";
import UserAuthRouter from "./routes/userRoutes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes/doctorRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

await ConnectDB();

app.use("/api", UserAuthRouter);
app.use("/api", doctorRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
