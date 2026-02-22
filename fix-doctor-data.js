import mongoose from "mongoose";
import Doctor from "./src/models/DoctorModel.js";
import dotenv from "dotenv";

dotenv.config();

async function fixDoctorData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all doctors with invalid time_slots
    const doctors = await Doctor.find();
    
    console.log(`\nFound ${doctors.length} doctors to check\n`);
    
    for (const doctor of doctors) {
      let needsUpdate = false;
      const updates = {};
      
      // Check and fix time_slots
      if (doctor.time_slots && doctor.time_slots.length > 0) {
        const firstSlot = doctor.time_slots[0];
        
        // If time_slots contains just a number (the bug), set default slots
        if (!isNaN(firstSlot) || (typeof firstSlot === 'string' && !firstSlot.includes(':') && !['morning', 'afternoon', 'evening'].includes(firstSlot.toLowerCase()))) {
          console.log(`Doctor ${doctor.fullName} has invalid time_slots: ${JSON.stringify(doctor.time_slots)}`);
          updates.time_slots = ['morning', 'afternoon', 'evening'];
          needsUpdate = true;
        }
      }
      
      // Check and fix available_days - ensure it has proper day names
      if (doctor.available_days && doctor.available_days.length > 0) {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const invalidDays = doctor.available_days.filter(day => !validDays.includes(day));
        
        if (invalidDays.length > 0) {
          console.log(`Doctor ${doctor.fullName} has invalid available_days: ${JSON.stringify(doctor.available_days)}`);
          // Set default weekdays if current data is invalid
          updates.available_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await Doctor.findByIdAndUpdate(doctor._id, updates);
        console.log(`✓ Updated doctor ${doctor.fullName}`);
        console.log(`  New time_slots: ${JSON.stringify(updates.time_slots || doctor.time_slots)}`);
        console.log(`  New available_days: ${JSON.stringify(updates.available_days || doctor.available_days)}\n`);
      }
    }
    
    console.log("Migration completed!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixDoctorData();
