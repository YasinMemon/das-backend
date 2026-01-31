import Doctor from "../../models/DoctorModel.js";
import bcrypt from "bcrypt";

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
    
  } catch (error) {
    
  }
}

export { registerDoctor };
