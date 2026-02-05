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

    if (!doctor.time_slots.includes(timeSlot)) {
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
