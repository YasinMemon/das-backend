import { Router } from "express";
import { 
  CreateAppointment,
  GetAppointments,
  ApproveAppointment,
  RejectAppointment,
  InitiatePayment,
  ConfirmPayment,
  CompleteAppointment,
  GetPendingAppointments,
  GetRefundStatus,
  UpdateCommission,
  GetSettlementReport,
} from "../../controllers/appointments/AppointmentController.js";
import verifyToken, { verifyAdmin } from "../../middlewares/authMiddleware.js";

const appointmentRoutes = Router();

// Patient endpoints
appointmentRoutes.post("/appointment/create", verifyToken, CreateAppointment);
appointmentRoutes.get("/user/appointments", verifyToken, GetAppointments);
appointmentRoutes.post("/appointment/:appointmentId/initiate-payment", verifyToken, InitiatePayment);
appointmentRoutes.post("/appointment/:appointmentId/confirm-payment", ConfirmPayment); // Usually webhook or direct call
appointmentRoutes.get("/appointment/:appointmentId/refund-status", verifyToken, GetRefundStatus);

// Doctor endpoints
appointmentRoutes.post("/appointment/:appointmentId/approve", verifyToken, ApproveAppointment);
appointmentRoutes.post("/appointment/:appointmentId/reject", verifyToken, RejectAppointment);
appointmentRoutes.post("/appointment/:appointmentId/complete", verifyToken, CompleteAppointment);
appointmentRoutes.get("/doctor/pending-appointments", verifyToken, GetPendingAppointments);

// Admin endpoints
appointmentRoutes.put("/admin/commission", verifyToken, verifyAdmin, UpdateCommission);
appointmentRoutes.get("/admin/settlement-report", verifyToken, verifyAdmin, GetSettlementReport);

export default appointmentRoutes;
