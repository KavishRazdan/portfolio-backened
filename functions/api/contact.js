// functions/api/contact.js – Cloudflare Worker endpoint
// Resend client is instantiated per request using secrets injected via env.

export default {
  async fetch(request, env) {
    // ----- CORS handling -----
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = (env.CORS_ORIGINS || "*").split(",");
    const corsHeader = allowedOrigins.includes("*") || allowedOrigins.includes(origin) ? origin : "";
    const corsHeaders = corsHeader
      ? {
          "Access-Control-Allow-Origin": corsHeader,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      : {};

    // Preflight request handling
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Accept only POST requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    // Parse JSON body
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { name, email, message } = payload;
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Secrets injected by Wrangler (set via `wrangler secret put`)
    const { RESEND_API_KEY, RESEND_FROM } = env; // env contains the secrets
    const TO_EMAIL = "razdankavish67@gmail.com"; // destination address

    // Dynamically import Resend to keep bundle size small
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
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      });
      console.log("Resend response:", result);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err) {
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
