/**
 * Email templates for the Doctor Appointment System
 */

export const emailTemplates = {
  /**
   * User Registration Welcome Email
   * @param {string} fullName - User's full name
   * @param {string} appUrl - Application URL
   * @returns {string} - HTML email template
   */
  userWelcome: (fullName, appUrl = process.env.APP_URL) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .content {
              padding: 30px 20px;
              color: #333;
            }
            .content h2 {
              color: #667eea;
              margin-top: 0;
            }
            .content p {
              line-height: 1.6;
              margin: 15px 0;
            }
            .features {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .features ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .features li {
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .features li:last-child {
              border-bottom: none;
            }
            .features li:before {
              content: "✓ ";
              color: #667eea;
              font-weight: bold;
              margin-right: 10px;
            }
            .cta-button {
              display: inline-block;
              background-color: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .footer {
              background-color: #f0f0f0;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .logo {
              color: #667eea;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Welcome to ${process.env.APP_NAME}</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${fullName},</h2>
              
              <p>Thank you for registering with us! We're excited to have you join our platform.</p>
              
              <p>Your account has been successfully created and is ready to use. You can now:</p>
              
              <div class="features">
                <ul>
                  <li>Search and book appointments with qualified doctors</li>
                  <li>View your appointment history and upcoming bookings</li>
                  <li>Manage your medical profile securely</li>
                  <li>Receive appointment reminders and updates</li>
                  <li>Get professional healthcare at your convenience</li>
                </ul>
              </div>
              
              <p>To get started, click the button below to access your dashboard:</p>
              
              <center>
                <a href="${appUrl}/user-dashboard" class="cta-button">Go to Dashboard</a>
              </center>
              
              <p><strong>Your login credentials:</strong></p>
              <p>Keep your password secure and never share it with anyone.</p>
              
              <p>If you have any questions or need assistance, our support team is here to help!</p>
              
              <p>Best regards,<br><strong>The ${process.env.APP_NAME} Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
              <p>You received this email because you registered on our platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Doctor Approval/Verification Email
   * @param {string} fullName - Doctor's full name
   * @param {string} appUrl - Application URL
   * @returns {string} - HTML email template
   */
  doctorApproval: (fullName, appUrl = process.env.APP_URL) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .status-badge {
              display: inline-block;
              background-color: rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 20px;
              margin-top: 10px;
              font-size: 14px;
            }
            .content {
              padding: 30px 20px;
              color: #333;
            }
            .content h2 {
              color: #10b981;
              margin-top: 0;
            }
            .content p {
              line-height: 1.6;
              margin: 15px 0;
            }
            .next-steps {
              background-color: #f0fdf4;
              padding: 20px;
              border-left: 4px solid #10b981;
              border-radius: 5px;
              margin: 20px 0;
            }
            .next-steps h3 {
              color: #10b981;
              margin-top: 0;
            }
            .next-steps ol {
              padding-left: 20px;
            }
            .next-steps li {
              margin: 10px 0;
              line-height: 1.6;
            }
            .cta-button {
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .footer {
              background-color: #f0f0f0;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .verification-details {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border: 1px solid #e0e0e0;
            }
            .verification-details p {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Profile Verified!</h1>
              <div class="status-badge">APPROVED</div>
            </div>
            
            <div class="content">
              <h2>Dear Dr. ${fullName},</h2>
              
              <p>Congratulations! Your profile has been successfully verified by our admin team.</p>
              
              <div class="verification-details">
                <p><strong>Verification Status:</strong> ✓ Approved</p>
                <p><strong>Verified On:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Your Profile:</strong> Active and visible to patients</p>
              </div>
              
              <p>You can now fully utilize the platform to connect with patients and manage your appointments.</p>
              
              <div class="next-steps">
                <h3>Next Steps:</h3>
                <ol>
                  <li>Log in to your doctor dashboard</li>
                  <li>Complete your profile details (if needed)</li>
                  <li>Set your availability and consultation fees</li>
                  <li>Start receiving appointment requests from patients</li>
                  <li>Manage appointments and patient communications</li>
                </ol>
              </div>
              
              <p>Click below to access your doctor dashboard:</p>
              
              <center>
                <a href="${appUrl}/doctor-dashboard" class="cta-button">Go to Doctor Dashboard</a>
              </center>
              
              <p><strong>Important Reminders:</strong></p>
              <ul>
                <li>Ensure your profile information is accurate and up-to-date</li>
                <li>Update your availability regularly</li>
                <li>Respond to appointment requests promptly</li>
                <li>Maintain professional communication with patients</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br><strong>The ${process.env.APP_NAME} Admin Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
              <p>This is an automated verification confirmation email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
  /**
   * Appointment Confirmation Email
   * @param {Object} details - Appointment details
   * @returns {string} - HTML email template
   */
  appointmentConfirmation: (details) => {
    const { 
      patientName, 
      doctorName, 
      date, 
      time, 
      type, 
      fee, 
      transactionId, 
      role // 'patient', 'doctor', or 'admin'
    } = details;

    const roleText = {
      patient: `Your appointment with <strong>Dr. ${doctorName}</strong> has been successfully confirmed.`,
      doctor: `A new appointment has been booked with you by <strong>${patientName}</strong>.`,
      admin: `A new appointment has been confirmed between <strong>${patientName}</strong> and <strong>Dr. ${doctorName}</strong>.`
    };

    const primaryColor = "#2563eb"; // Blue 600

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', 'Arial', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background-color: ${primaryColor}; color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 40px 30px; color: #1e293b; }
            .greeting { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
            .message { line-height: 1.6; margin-bottom: 30px; color: #475569; }
            .details-card { background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
            .detail-item { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
            .detail-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .label { font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; }
            .value { font-weight: 700; color: #0f172a; font-size: 15px; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
            .button { display: inline-block; background-color: ${primaryColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello,</div>
              <p class="message">${roleText[role]}</p>
              
              <div class="details-card">
                <div class="detail-item">
                  <span class="label">Patient</span>
                  <span class="value">${patientName}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Doctor</span>
                  <span class="value">Dr. ${doctorName}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Date</span>
                  <span class="value">${date}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Time</span>
                  <span class="value">${time}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Consultation</span>
                  <span class="value">${type}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Amount Paid</span>
                  <span class="value">$${fee}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Transaction ID</span>
                  <span class="value">${transactionId}</span>
                </div>
              </div>
              
              <center>
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/profile" class="button">View Appointment Details</a>
              </center>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DocBook'}. All rights reserved.</p>
              <p>This is a confirmation email for your paid appointment.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  paymentReceived: (details) => {
    const { patientName, doctorName, date, time, type, fee, transactionId } = details;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#f59e0b;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">⏳ Payment Received - Awaiting Approval</h1></div><div style="padding:30px;color:#1e293b"><p>Hello <strong>${patientName}</strong>,</p><p>Your payment of <strong>₹${fee}</strong> for appointment with <strong>Dr. ${doctorName}</strong> has been received successfully.</p><p><strong>Your appointment is now pending doctor's approval.</strong> You will be notified once the doctor reviews your request.</p><div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e2e8f0"><p><strong>Date:</strong> ${date}</p><p><strong>Time:</strong> ${time}</p><p><strong>Type:</strong> ${type}</p><p><strong>Fee:</strong> ₹${fee}</p><p><strong>Transaction:</strong> ${transactionId}</p></div><p style="color:#64748b;font-size:13px">If the doctor rejects your appointment, a full refund will be automatically processed.</p></div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}. All rights reserved.</p></div></div></body></html>`;
  },

  newAppointmentRequest: (details) => {
    const { patientName, doctorName, date, time, type, fee } = details;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#7c3aed;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">🔔 New Appointment Request</h1></div><div style="padding:30px;color:#1e293b"><p>Dear <strong>Dr. ${doctorName}</strong>,</p><p>You have a new appointment request from <strong>${patientName}</strong>. Payment has been received and is being held.</p><div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e2e8f0"><p><strong>Patient:</strong> ${patientName}</p><p><strong>Date:</strong> ${date}</p><p><strong>Time:</strong> ${time}</p><p><strong>Type:</strong> ${type}</p><p><strong>Fee:</strong> ₹${fee}</p></div><p><strong>Please log in to your dashboard to approve or reject this appointment.</strong></p><center><a href="${process.env.APP_URL || 'http://localhost:5173'}/doctor-dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;margin:20px 0">Go to Dashboard</a></center></div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}.</p></div></div></body></html>`;
  },

  appointmentRejection: (details) => {
    const { patientName, doctorName, date, time, fee, reason, refundId, refundAmount, refundStatus } = details;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#ef4444;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">❌ Appointment Rejected</h1></div><div style="padding:30px;color:#1e293b"><p>Hello <strong>${patientName}</strong>,</p><p>Unfortunately, your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been rejected.</p><div style="background:#fef2f2;border-radius:8px;padding:15px;margin:15px 0;border-left:4px solid #ef4444"><p><strong>Reason:</strong> ${reason}</p></div><div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #bbf7d0"><h3 style="color:#16a34a;margin-top:0">💰 Refund Details</h3><p><strong>Refund Amount:</strong> ₹${refundAmount || fee}</p><p><strong>Refund ID:</strong> ${refundId || 'Processing'}</p><p><strong>Status:</strong> ${refundStatus || 'Initiated'}</p><p style="color:#64748b;font-size:13px">The refund will be credited to your original payment method within 5-7 business days.</p></div><p>We encourage you to explore other available doctors on our platform.</p></div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}.</p></div></div></body></html>`;
  },

  doctorRejectionConfirmation: (details) => {
    const { patientName, doctorName, date, time, reason } = details;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#64748b;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">Appointment Rejection Confirmed</h1></div><div style="padding:30px;color:#1e293b"><p>Dear <strong>Dr. ${doctorName}</strong>,</p><p>You have rejected the appointment request from <strong>${patientName}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p><p><strong>Reason:</strong> ${reason}</p><p>A full refund has been initiated to the patient. No further action is required.</p></div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}.</p></div></div></body></html>`;
  },

  refundCompleted: (details) => {
    const { patientName, doctorName, refundAmount, refundId, date } = details;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#16a34a;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">✅ Refund Processed Successfully</h1></div><div style="padding:30px;color:#1e293b"><p>Hello <strong>${patientName}</strong>,</p><p>Your refund of <strong>₹${refundAmount}</strong> for the appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> has been successfully processed.</p><div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #bbf7d0"><p><strong>Refund Amount:</strong> ₹${refundAmount}</p><p><strong>Refund ID:</strong> ${refundId}</p><p><strong>Status:</strong> Completed</p></div><p style="color:#64748b;font-size:13px">The amount will reflect in your account within 5-7 business days depending on your bank.</p></div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}.</p></div></div></body></html>`;
  },

  adminPaymentNotification: (details) => {
    const { patientName, doctorName, date, time, type, fee, transactionId } = details;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#1e40af;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">💳 New Payment - Pending Approval</h1></div><div style="padding:30px;color:#1e293b"><p>A new appointment payment has been received and is pending doctor approval.</p><div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e2e8f0"><p><strong>Patient:</strong> ${patientName}</p><p><strong>Doctor:</strong> Dr. ${doctorName}</p><p><strong>Date:</strong> ${date} at ${time}</p><p><strong>Type:</strong> ${type}</p><p><strong>Fee:</strong> ₹${fee}</p><p><strong>Transaction:</strong> ${transactionId}</p><p><strong>Commission:</strong> ${process.env.PLATFORM_COMMISSION || 10}%</p></div></div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}.</p></div></div></body></html>`;
  },

  appointmentConfirmation: (details) => {
    const { patientName, doctorName, date, time, type, fee, transactionId, role } = details;
    const isPatient = role === "patient";
    const greeting = isPatient ? `Hello <strong>${patientName}</strong>` : `Dear <strong>Dr. ${doctorName}</strong>`;
    const message = isPatient
      ? `Great news! Your appointment with <strong>Dr. ${doctorName}</strong> has been approved and confirmed.`
      : `You have approved the appointment with <strong>${patientName}</strong>.`;
    return `<html><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><div style="background:#16a34a;color:#fff;padding:30px 20px;text-align:center"><h1 style="margin:0;font-size:22px">✅ Appointment Confirmed</h1></div><div style="padding:30px;color:#1e293b"><p>${greeting},</p><p>${message}</p><div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #bbf7d0"><p><strong>Patient:</strong> ${patientName}</p><p><strong>Doctor:</strong> Dr. ${doctorName}</p><p><strong>Date:</strong> ${date}</p><p><strong>Time:</strong> ${time}</p><p><strong>Type:</strong> ${type}</p><p><strong>Fee:</strong> ₹${fee}</p>${transactionId ? `<p><strong>Transaction:</strong> ${transactionId}</p>` : ''}</div>${isPatient ? '<p>Please arrive on time for your appointment. If you need to cancel, please do so at least 24 hours in advance.</p>' : '<p>The patient has been notified. Payment has been released to your account.</p>'}</div><div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0"><p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DAS'}.</p></div></div></body></html>`;
  },
};

export default emailTemplates;
