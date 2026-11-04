// functions/api/contact.js – Cloudflare Worker endpoint
// Resend client is instantiated once per request using secrets.

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, message } = payload;
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Secrets injected by Wrangler (set via `wrangler secret put`)
  const RESEND_API_KEY = RESEND_API_KEY; // secret
  const RESEND_FROM = RESEND_FROM;       // verified sender address
  const TO_EMAIL = "razdankavish67@gmail.com"; // destination

  // Dynamically import Resend to keep the bundle small
  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: TO_EMAIL,
      subject: `New contact from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\\n/g, "<br>")}</p>
      `,
    });
    console.log("Resend response:", result);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Resend error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

