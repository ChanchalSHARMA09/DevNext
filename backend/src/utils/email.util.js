// src/utils/email.util.js

/**
 * Sends an email using the Brevo HTTP REST API.
 * Maps classic Nodemailer arguments (to, subject, html) into Brevo API payload layout.
 */
export const sendEmail = async (options) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
        console.error("❌ Email Service Error: Missing BREVO_API_KEY or SENDER_EMAIL in environment variables.");
        throw new Error("Email configuration missing on server.");
    }

    // Safely map your service parameters
    const recipientEmail = options.to || options.email;
    const emailSubject = options.subject || 'Notification from DevNext';
    const emailContent = options.html || options.text || options.message;

    if (!recipientEmail) {
        console.error("❌ Email Service Error: Recipient email ('to') is missing from parameters.");
        throw new Error("Recipient email is missing.");
    }

    // Build the payload required by Brevo's V3 API
    const payload = {
        sender: { 
            name: "DevNext Support", 
            email: senderEmail 
        },
        to: [
            { email: recipientEmail }
        ],
        subject: emailSubject,
        htmlContent: emailContent // Brevo reads HTML here
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Brevo API returned an error:", data);
            throw new Error(data.message || "Failed to deliver email via Brevo REST API.");
        }

        console.log(`🚀 Email successfully sent via Brevo HTTP API! Message ID: ${data.messageId}`);
        return data;

    } catch (error) {
        console.error("❌ Error inside Email Utility layer:", error.message);
        throw error;
    }
};

export default sendEmail;