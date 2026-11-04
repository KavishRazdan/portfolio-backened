// index.js – Express server that forwards contact form data to Resend (CommonJS)

require("dotenv").config(); // loads .env automatically
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // allow any origin (adjust for production)
app.use(express.json()); // parse JSON bodies

// Initialise Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM; // must be a verified sender in Resend
const TO_EMAIL = "razdankavish67@gmail.com"; // destination email

// POST /api/contact – expects { name, email, message }
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL, // send to your personal email
      subject: `New contact from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\\n/g, "<br>")}</p>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email API listening on http://localhost:${PORT}`);
});
