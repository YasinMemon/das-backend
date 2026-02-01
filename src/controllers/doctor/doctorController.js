import Doctor from "../../models/DoctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function registerDoctor(req, res) {
  // Registration logic here
  try {
    const doctorData = req.body;

    if (!doctorData) {
      return res.status(400).json({ message: "Doctor data is required." });
    }

    const newDoctor = { ...doctorData };

    const hashedPassword = await bcrypt.hash(newDoctor.password, 10);
    newDoctor.password = hashedPassword;
    const doctor = new Doctor(newDoctor);
    await doctor.save();
    return res.status(201).json({ message: "Doctor registered successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
}

async function loginDoctor(req, res) {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ message: "Login successful." }).cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error." });
  }
}

const logoutDoctor = (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "No token provided." });
    }
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return res.json({ message: "Logout successful." });
  } catch (error) {
    return res.status(500).json({ message: "Server error." });
  }
};

export { registerDoctor, loginDoctor, logoutDoctor };
