// server.js
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Twilio and this will collect my account info from the .env file
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS endpoint
app.post('/api/send-sms', async (req, res) => {
  const { phone, appointmentId, appointmentData } = req.body;
  
  try {
    const message = await twilioClient.messages.create({
      body: ` HealthCare Reminder\n\nProvider: ${appointmentData.providerName}\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}\nMode: ${appointmentData.mode}\n\nReply CANCEL to cancel.\nSupport: 1-800-HELP-911`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    
    res.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error("Twilio Error:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));