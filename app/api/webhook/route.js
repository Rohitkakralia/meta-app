// app/api/webhook/route.js

import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { messageStore } from "@/lib/messageStore";

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
  } catch (err) {
    return new NextResponse("Error", { status: 500 });
  }
}

// ── RECEIVE WEBHOOK EVENTS (POST) ────────────────────
export async function POST(request) {
  try {
    const rawBody = await request.text();
    console.log("[webhook] Received event:", rawBody);

    // Verify signature
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

    const payload = JSON.parse(rawBody);

    if (payload.object !== "whatsapp_business_account")
      return new NextResponse("Not a WhatsApp event", { status: 200 });

    const tasks = [];

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;
        const value = change.value;

        // ── Inbound messages (user → you) ───────────
        for (const msg of value.messages ?? []) {
          tasks.push(handleIncoming(msg, value));
        }

        // ── Outbound status updates (your msg → user) ─
        for (const status of value.statuses ?? []) {
          tasks.push(handleStatus(status));
        }
      }
    }

    const results = await Promise.allSettled(tasks);
    console.log("[webhook] All events processed", results.map((r) => r.value ?? r.reason));

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("[webhook] POST error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}

// ── Save inbound message ──────────────────────────────
function handleIncoming(msg, value) {
  const contact = value.contacts?.find((c) => c.wa_id === msg.from);

  const incoming = {
    id:          msg.id,
    from:        msg.from,                              // e.g. "919915082305"
    fromName:    contact?.profile?.name ?? "Unknown",
    type:        msg.type,
    text:        msg.text?.body        ?? null,
    image:       msg.image             ?? null,
    audio:       msg.audio             ?? null,
    video:       msg.video             ?? null,
    document:    msg.document          ?? null,
    interactive: msg.interactive       ?? null,
    location:    msg.location          ?? null,
    sticker:     msg.sticker           ?? null,
    direction:   "inbound",
    status:      "received",
    timestamp:   parseInt(msg.timestamp) * 1000,
  };

  // Add proxy URLs for media messages
  if (incoming.image?.id) {
    incoming.image.url = `/api/whatsapp-media?id=${incoming.image.id}`;
  }
  if (incoming.video?.id) {
    incoming.video.url = `/api/whatsapp-media?id=${incoming.video.id}`;
  }
  if (incoming.audio?.id) {
    incoming.audio.url = `/api/whatsapp-media?id=${incoming.audio.id}`;
  }
  if (incoming.document?.id) {
    incoming.document.url = `/api/whatsapp-media?id=${incoming.document.id}`;
  }
  if (incoming.sticker?.id) {
    incoming.sticker.url = `/api/whatsapp-media?id=${incoming.sticker.id}`;
  }

  const saved = messageStore.save(incoming);
  console.log(`[webhook] inbound saved | from=${incoming.from} | text="${incoming.text ?? incoming.type}"`);
  return saved;
}

// ── Update outbound message status ───────────────────
//
// The status event contains:
// {
//   id: "wamid.xxx",          ← matches what send route saved
//   status: "read",
//   timestamp: "1774604977",
//   recipient_id: "919915082305",
//   pricing: { billable: true, ... }
// }
function handleStatus(status) {
  const update = {
    messageId:      status.id,
    recipientPhone: status.recipient_id,
    status:         status.status,       // "sent" | "delivered" | "read" | "failed"
    timestamp:      new Date(parseInt(status.timestamp) * 1000).toISOString(),
    conversation:   status.conversation ?? null,
    billable:       status.pricing?.billable ?? null,
    errors:         status.errors ?? [],
  };

  console.log("[webhook] Outbound status:", update);

  // This updates the message in messageStore so ChatRoom sees the new status
  const updated = messageStore.updateStatus(status.id, status.status);

  if (!updated) {
    // Message wasn't in store (sent before server restart, or from bulk sender)
    // Insert a skeleton so the conversation API still returns something
    // Try to determine if this might be a template message based on the message ID pattern
    // Template messages often have different characteristics, but we can't know for sure
    messageStore.save({
      id:        status.id,
      text:      "[Message sent before server restart]", // More descriptive text
      type:      "text", // Default to text since we don't know the actual type
      direction: "outbound",
      to:        status.recipient_id,
      status:    status.status,
      timestamp: parseInt(status.timestamp) * 1000,
    });
    console.log(`[webhook] skeleton saved for unknown wamid ${status.id}`);
  } else {
    console.log(`[webhook] status updated: ${status.id} → ${status.status} (recipient: ${status.recipient_id})`);
  }

  if (update.status === "failed") {
    console.error(
      `[webhook] FAILED | id=${update.messageId} | recipient=${update.recipientPhone}`,
      update.errors
    );
  }

  return update;
}