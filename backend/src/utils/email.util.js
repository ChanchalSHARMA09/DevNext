// src/utils/email.util.js
import nodemailer from 'nodemailer';
const port = parseInt(process.env.SMTP_PORT, 10),

export const sendEmail = async ({ to, subject, text, html }) => {
    // Configure this with your SMTP provider (e.g., SendGrid, AWS SES, or Gmail for testing)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false // Prevents local environment handshake crashes
        }
    });

    const mailOptions = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        text,
        html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;