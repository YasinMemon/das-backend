import Admin from "../../models/adminModel.js";
import bcrypt from "bcrypt";

async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function ApproveDoctor(req, res) {
  try {
    const { doctorId } = req.params;
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

export { adminLogin, ApproveDoctor };
