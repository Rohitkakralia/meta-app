// app/api/whatsapp/conversation/route.js
//
// GET /api/whatsapp/conversation?phone=919915082305
// Returns full conversation (inbound + outbound) sorted oldest → newest.

import { messageStore } from "@/lib/messageStore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone)
      return Response.json(
        { error: "phone query param is required" },
        { status: 400 }
      );

    const messages = messageStore.getConversation(phone);

    console.log(`[conversation] GET phone=${phone} → ${messages.length} messages`);

    return Response.json({ phone, messages, total: messages.length });
  } catch (err) {
    console.error("[conversation] GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}