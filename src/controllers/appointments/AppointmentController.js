import Appointment from "../../models/AppointmentModel.js";
import Doctor from "../../models/DoctorModel.js";

export const CreateAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, appointmentDate, timeSlot, consultationType } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !consultationType) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!["Clinic", "Online"].includes(consultationType)) {
      return res.status(400).json({ message: "Invalid consultation type." });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Additional logic to create and save the appointment would go here
    if (
      !doctor.available_days.includes(
        new Date(appointmentDate).toLocaleString("en-US", { weekday: "long" }),
      )
    ) {
      return res
        .status(400)
        .json({ message: "Doctor is not available on the selected day." });
    }

    // Check if the time slot is available
    // Time slots can be stored as ranges (morning, afternoon, evening) or specific times
    const isTimeSlotAvailable = (slots, selectedTime) => {
      if (!slots || slots.length === 0) return false;
      
      // Define time ranges for slot names
      const slotRanges = {
        morning: { start: 9, end: 12 },    // 9 AM - 12 PM
        afternoon: { start: 12, end: 17 }, // 12 PM - 5 PM
        evening: { start: 17, end: 21 }    // 5 PM - 9 PM
      };
      
      // Extract hour from selected time (e.g., "10:00 AM" -> 10)
      const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return false;
      
      let hour = parseInt(timeMatch[1]);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      // Check if selected time falls within any available slot
      for (const slot of slots) {
        const slotLower = slot.toLowerCase();
        
        // If slot is a range name (morning/afternoon/evening)
        if (slotRanges[slotLower]) {
          const range = slotRanges[slotLower];
          if (hour >= range.start && hour < range.end) {
            return true;
          }
        }
        // If slot is a specific time, check for exact match
        else if (slot === selectedTime) {
          return true;
        }
      }
      
      return false;
    };

    if (!isTimeSlotAvailable(doctor.time_slots, timeSlot)) {
      return res
        .status(400)
        .json({ message: "Selected time slot is not available." });
    }

    const alreadyBooked = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot: timeSlot,
      status: "Scheduled",
    });

    if (alreadyBooked) {
      return res
        .status(400)
        .json({ message: "The selected time slot is already booked." });
    }

    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      consulation_type: consultationType,
      fee: doctor.consulation_fee,
    });

    await newAppointment.save();
    console.log("New appointment created:", {
      appointmentId: newAppointment._id,
      patient: patientId,
      doctor: doctorId,
      appointmentDate: appointmentDate
    });
    
    return res.status(201).json({
      message: "Appointment created successfully.",
      appointment: newAppointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const GetAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.find({ patient: userId });

    return res.status(200).json({ appointments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
