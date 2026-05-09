import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initialize email transporter with SMTP config
 * @returns {Object} - Nodemailer transporter
 */
function getTransporter() {
  if (!transporter) {
    // Validate required env variables
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing SMTP environment variables: ${missing.join(', ')}`);
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log(`✓ Email transporter initialized: ${process.env.SMTP_EMAIL}`);
  }
  
  return transporter;
}

/**
 * Send email utility function
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content for email body
 * @returns {Promise<Object>} - Email send result
 */
async function sendEmail(email, subject, htmlContent) {
  try {
    const transport = getTransporter();

    // Mail options
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Doctor Appointment System'}" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    // Send email
    const info = await transport.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${email}:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('✗ Error sending email:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email',
    };
  }
}

export default sendEmail;
