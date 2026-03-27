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

    console.log("FULL PAYLOAD:", JSON.stringify(payload, null, 2));

    if (payload.object !== "whatsapp_business_account") {
      return new Response("Not WhatsApp Event", { status: 200 });
    }

    payload.entry?.forEach((entry) => {
      entry.changes?.forEach((change) => {

        if (change.field === "messages") {
          const value = change.value;

          // 📩 Incoming messages
          if (value.messages) {
            value.messages.forEach(async (msg) => {
              console.log("📩 New Message:", msg.text?.body || msg.interactive?.button_reply?.title || "Media message");
              console.log("From:", msg.from);
              console.log("Message ID:", msg.id);
              console.log("Timestamp:", msg.timestamp);
              
              const incomingMessage = {
                id: msg.id,
                from: msg.from,
                to: value.metadata?.phone_number_id,
                text: msg.text?.body || msg.interactive?.button_reply?.title || "",
                type: msg.type,
                timestamp: parseInt(msg.timestamp) * 1000, // Convert to milliseconds
                context: msg.context,
                interactive: msg.interactive,
                media: msg.image || msg.video || msg.audio || msg.document,
                contacts: value.contacts?.[0] // Contact info if available
              };
              
              // Process the incoming message
              await processIncomingMessage(incomingMessage);
            });
          }

          // 📊 Status updates (delivery receipts)
          if (value.statuses) {
            value.statuses.forEach(async (status) => {
              console.log("📊 Message Status Update:");
              console.log("  Message ID:", status.id);
              console.log("  Status:", status.status);
              console.log("  Recipient:", status.recipient_id);
              console.log("  Timestamp:", status.timestamp);
              
              const statusUpdate = {
                messageId: status.id,
                recipientId: status.recipient_id,
                status: status.status, // sent, delivered, read, failed
                timestamp: parseInt(status.timestamp) * 1000,
                errors: status.errors
              };
              
              // Process the status update
              await processMessageStatus(statusUpdate);
            });
          }
        }

        // 📄 Template updates (v24.0)
        if (change.field === "message_template_status_update") {
          console.log("📄 Template Update (v24.0):", change.value);
          
          // Process template status update
          if (change.value) {
            const templateUpdate = {
              messageTemplateId: change.value.message_template_id,
              messageTemplateName: change.value.message_template_name,
              messageTemplateLanguage: change.value.message_template_language,
              previousStatus: change.value.previous_status,
              newStatus: change.value.new_status,
              reason: change.value.reason,
              timestamp: new Date().toISOString(),
              version: "v24.0"
            };
            
            // Process the template status update
            await processTemplateStatusUpdate(templateUpdate);
          }
        }

      });
    });

    return new Response("EVENT_RECEIVED", { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response("Error", { status: 500 });
  }
}

// ── MESSAGE PROCESSORS ────────────────────────────────

// Process incoming messages from users
async function processIncomingMessage(message) {
  console.log("Processing incoming message:", message);
  
  try {
    // Store message in conversation history
    const storeResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/messages/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: message.from,
        message: {
          id: message.id,
          text: message.text,
          sender: "other", // Incoming message from user
          timestamp: message.timestamp,
          status: "received",
          type: message.type,
          from: message.from,
          to: message.to
        }
      })
    });

    if (storeResponse.ok) {
      console.log(`💾 Stored incoming message from ${message.from}`);
    }
    
    console.log(`💬 Message from ${message.from}: "${message.text}"`);
    
    // Auto-reply logic
    if (message.text?.toLowerCase().includes("hello") || message.text?.toLowerCase().includes("hi")) {
      console.log("🤖 Auto-reply triggered for greeting");
      
      // Send auto-reply after a short delay
      setTimeout(async () => {
        try {
          const replyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/messages/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: message.from,
              message: "Hello! Thanks for your message. How can I help you today?",
              type: "text"
            })
          });
          
          if (replyResponse.ok) {
            console.log("🤖 Auto-reply sent successfully");
          }
        } catch (error) {
          console.error("Auto-reply error:", error);
        }
      }, 1000);
    }
    
    // Broadcast to real-time clients (implement WebSocket/SSE here)
    await broadcastMessage({
      type: "incoming_message",
      data: message
    });
    
    return { success: true, message };
  } catch (error) {
    console.error("Error processing incoming message:", error);
    return { success: false, error: error.message };
  }
}

// Process message status updates (delivery receipts)
async function processMessageStatus(statusUpdate) {
  console.log("Processing message status:", statusUpdate);
  
  try {
    // Update message status in conversation storage
    const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/messages/conversation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: statusUpdate.recipientId,
        messageId: statusUpdate.messageId,
        status: statusUpdate.status
      })
    });

    if (updateResponse.ok) {
      console.log(`📊 Updated message ${statusUpdate.messageId} status to ${statusUpdate.status}`);
    }
    
    // Broadcast to real-time clients
    await broadcastMessage({
      type: "message_status",
      data: statusUpdate
    });
    
    return { success: true, statusUpdate };
  } catch (error) {
    console.error("Error processing message status:", error);
    return { success: false, error: error.message };
  }
}

// Broadcast messages to connected clients (placeholder for WebSocket/SSE)
async function broadcastMessage(payload) {
  // In a real implementation, you would:
  // 1. Use WebSocket connections to broadcast to connected clients
  // 2. Use Server-Sent Events (SSE) for real-time updates
  // 3. Use a message queue like Redis for scaling
  
  console.log("📡 Broadcasting:", payload.type, payload.data);
  
  // For now, just log - you'll implement actual broadcasting based on your needs
  return { broadcasted: true, payload };
}

// ── TEMPLATE STATUS UPDATE PROCESSOR ──────────────────
async function processTemplateStatusUpdate(templateUpdate) {
  console.log("Processing template status update:", templateUpdate);
  
  try {
    // Here you can:
    // 1. Save to database
    // 2. Update UI via WebSocket/Server-Sent Events
    // 3. Send notifications
    // 4. Update template cache
    
    // For now, we'll log the status change
    console.log(`Template "${templateUpdate.messageTemplateName}" status changed from "${templateUpdate.previousStatus}" to "${templateUpdate.newStatus}"`);
    
    if (templateUpdate.reason) {
      console.log(`Reason: ${templateUpdate.reason}`);
    }
    
    // You can add more processing logic here based on the status
    switch (templateUpdate.newStatus) {
      case "APPROVED":
        console.log("✅ Template approved - ready to use");
        break;
      case "REJECTED":
        console.log("❌ Template rejected - needs revision");
        break;
      case "PENDING":
        console.log("⏳ Template pending review");
        break;
      case "DISABLED":
        console.log("🚫 Template disabled");
        break;
      default:
        console.log(`📄 Template status: ${templateUpdate.newStatus}`);
    }
    
    return { success: true, templateUpdate };
  } catch (error) {
    console.error("Error processing template status update:", error);
    return { success: false, error: error.message };
  }
}