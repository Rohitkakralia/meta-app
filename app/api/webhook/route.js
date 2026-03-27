import { NextResponse } from "next/server";

// ── VERIFY WEBHOOK (GET) ──────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (
      mode === "subscribe" &&
      token === process.env.META_WEBHOOK_VERIFY_TOKEN
    ) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("Webhook verify error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

// ── HANDLE WEBHOOK EVENTS (POST) ──────────────────────
export async function POST(request) {
  try {
    const payload = await request.json();
    const object = payload?.object;

    if (!["page", "instagram"].includes(object)) {
      return NextResponse.json({ message: "EVENT_RECEIVED" }, { status: 200 });
    }

    // 🔥 Process immediately (like dispatchSync)
    try {
      await processMetaWebhook(payload);
    } catch (err) {
      console.error("Processing failed, fallback:", err);

      // Optional: fallback async (like queue)
      setTimeout(() => {
        processMetaWebhook(payload).catch((e) =>
          console.error("Async retry failed:", e)
        );
      }, 0);
    }

    return NextResponse.json({ message: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error) {
    console.error("Webhook handle error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// ── YOUR JOB LOGIC (replacement of Laravel Job) ───────
async function processMetaWebhook(payload) {
  console.log("Processing webhook:", JSON.stringify(payload, null, 2));

  // 👉 Add your logic here:
  // - Save message to DB
  // - Send auto-reply
  // - Call Meta API
}