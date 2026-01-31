import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // ensures only one username
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

// hash password
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

AdminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("Admin", AdminSchema);
