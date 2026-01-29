const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const emailUser = defineSecret('EMAIL_USER');
const emailPass = defineSecret('EMAIL_PASS');

// Transporter will be created inside the function to ensure secrets are available
const createTransporter = (user, pass) => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: user,
            pass: pass,
        },
    });
};

exports.sendFeedbackEmail = onDocumentCreated(
    {
        document: "feedback/{feedbackId}",
        secrets: [emailUser, emailPass],
        region: "us-central1" // Default region, change if needed
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const feedback = snapshot.data();
        const feedbackId = event.params.feedbackId;

        console.log(`Processing feedback ${feedbackId}`);

        const userEmail = feedback.userEmail || "Not provided";
        const userId = feedback.userId || "Anonymous";
        const appVersion = feedback.appVersion || "Unknown";
        const platform = feedback.platform || "Unknown";
        const message = feedback.message || "No message content";
        const createdAt = feedback.createdAt ? feedback.createdAt.toDate().toISOString() : new Date().toISOString();

        const mailOptions = {
            from: `TaskWise Feedback <${emailUser.value()}>`,
            to: emailUser.value(), // Sending to self/developer
            subject: `TaskWise Feedback from ${userEmail}`,
            text: `
New Feedback Received!

Message:
${message}

---
User Details:
Email: ${userEmail}
User ID: ${userId}
App Version: ${appVersion}
Platform: ${platform}
Time: ${createdAt}
Feedback ID: ${feedbackId}
            `,
            html: `
<h2>New Feedback Received</h2>
<p><strong>Message:</strong></p>
<blockquote style="background: #f9f9f9; border-left: 10px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">
${message.replace(/\n/g, '<br>')}
</blockquote>
<hr>
<h3>User Details</h3>
<ul>
    <li><strong>Email:</strong> ${userEmail}</li>
    <li><strong>User ID:</strong> ${userId}</li>
    <li><strong>App Version:</strong> ${appVersion}</li>
    <li><strong>Platform:</strong> ${platform}</li>
    <li><strong>Time:</strong> ${createdAt}</li>
    <li><strong>Feedback ID:</strong> ${feedbackId}</li>
</ul>
            `
        };

        try {
            const transporter = createTransporter(emailUser.value(), emailPass.value());
            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully for feedback ${feedbackId}`);

            // Optionally update the document to mark as sent
            await snapshot.ref.update({ emailSent: true, emailSentAt: admin.firestore.FieldValue.serverTimestamp() });
        } catch (error) {
            console.error(`Failed to send email for feedback ${feedbackId}:`, error);
            // We don't throw to avoid infinite retries if it's a permanent error (like auth)
            // But for transient errors, throwing might be appropriate if we want retry.
            // For now, logging only as per requirements "Handle function failures silently (log only)"
        }
    }
);
