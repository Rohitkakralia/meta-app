import { NextResponse } from "next/server";
import { createHmac } from "crypto";

// ── VERIFY WEBHOOK (GET) ──────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const mode      = searchParams.get("hub.mode");
    const token     = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("[webhook] GET error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

// ── RECEIVE WEBHOOK EVENTS (POST) ────────────────────
export async function POST(request) {
  try {
    const rawBody = await request.text();

    // ── Verify HMAC signature ─────────────────────────
    const sig = request.headers.get("x-hub-signature-256");
    if (sig && process.env.META_APP_SECRET) {
      const expected =
        "sha256=" +
        createHmac("sha256", process.env.META_APP_SECRET)
          .update(rawBody)
          .digest("hex");

      if (sig !== expected) {
        console.warn("[webhook] Invalid signature — rejected");
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    console.log("[webhook] Received event:", rawBody);

    const payload = JSON.parse(rawBody);

    if (payload.object !== "whatsapp_business_account") {
      return new NextResponse("Not a WhatsApp event", { status: 200 });
    }

    const tasks = [];

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        const value = change.value;

        // ── Incoming messages (user → you) ───────────────
        for (const msg of value.messages ?? []) {
          tasks.push(handleIncomingMessage(msg, value));
        }

        // ── Outbound status updates (your message → user) ─
        for (const status of value.statuses ?? []) {
          tasks.push(handleOutboundStatus(status));
        }
      }
    }


    await Promise.allSettled(tasks);

    console.log("[webhook] All events processed", tasks);

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("[webhook] POST error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

// ── Handle incoming message ───────────────────────────
//
// Exact Meta payload shape your webhook receives:
// {
//   field: "messages",
//   value: {
//     messaging_product: "whatsapp",
//     metadata: { display_phone_number: "16505551111", phone_number_id: "123456123" },
//     contacts: [{ profile: { name: "test user name" }, wa_id: "16315551181", user_id: "US.xxx" }],
//     messages: [{
//       id: "ABGGFlA5Fpa",
//       timestamp: "1504902988",
//       from: "16315551181",
//       from_user_id: "US.xxx",
//       type: "text",
//       text: { body: "this is a text message" }
//     }]
//   }
// }
async function handleIncomingMessage(msg, value) {
  // Match the sender's contact info using wa_id === msg.from
  const contact = value.contacts?.find((c) => c.wa_id === msg.from);

  const incoming = {
    // IDs
    messageId:          msg.id,
    fromPhone:          msg.from,                          // "16315551181"
    fromUserId:         msg.from_user_id ?? null,          // "US.134912..."
    senderName:         contact?.profile?.name ?? "Unknown", // "test user name"
    waId:               contact?.wa_id ?? msg.from,

    // Your business number that received this
    toPhoneNumberId:    value.metadata?.phone_number_id,   // "123456123"
    toDisplayPhone:     value.metadata?.display_phone_number, // "16505551111"

    // Message content — only one of these will be non-null per message
    type:        msg.type,                                 // "text" | "image" | "audio" | ...
    text:        msg.text?.body        ?? null,            // "this is a text message"
    image:       msg.image             ?? null,
    audio:       msg.audio             ?? null,
    video:       msg.video             ?? null,
    document:    msg.document          ?? null,
    interactive: msg.interactive       ?? null,
    location:    msg.location          ?? null,
    sticker:     msg.sticker           ?? null,
    contacts:    msg.contacts          ?? null,            // vCard contacts

    timestamp:   new Date(parseInt(msg.timestamp) * 1000).toISOString(),
    direction:   "inbound",
  };

  console.log("[webhook] Incoming message:", incoming);

  // TODO: save to your DB
  // await db.messages.create({ data: incoming });

  // TODO: push to frontend via WebSocket / SSE
  // await broadcast({ type: "new_message", data: incoming });

  return incoming;
}

// ── Handle outbound status update ────────────────────
//
// Meta fires this for every state change of a message YOU sent.
// Sequence: "sent" → "delivered" → "read"  (or "failed")
//
// IMPORTANT: Meta does NOT resend the message body here.
// Match by messageId to the record you saved when calling /api/whatsapp/send.
//
// Meta payload shape:
// {
//   id: "wamid.xxx",           ← same ID from your /api/whatsapp/send response
//   status: "sent",            ← "sent" | "delivered" | "read" | "failed"
//   timestamp: "1504902988",
//   recipient_id: "16315551181",
//   conversation: { id: "...", origin: { type: "user_initiated" } },
//   pricing: { billable: true, pricing_model: "CBP", category: "service" },
//   errors: [...]              ← only present on "failed"
// }
async function handleOutboundStatus(status) {
  const update = {
    messageId:      status.id,
    recipientPhone: status.recipient_id,
    status:         status.status,      // "sent" | "delivered" | "read" | "failed"
    timestamp:      new Date(parseInt(status.timestamp) * 1000).toISOString(),
    conversation:   status.conversation ?? null,
    billable:       status.pricing?.billable ?? null,
    errors:         status.errors ?? [],
  };

  console.log("[webhook] Outbound status:", update);

  if (update.status === "failed") {
    console.error(
      `[webhook] FAILED — messageId: ${update.messageId}, recipient: ${update.recipientPhone}`,
      update.errors
    );
  }

  // TODO: update your DB record using the messageId
  // await db.messages.update({
  //   where: { id: update.messageId },
  //   data:  { status: update.status, updatedAt: update.timestamp },
  // });

  return update;
}