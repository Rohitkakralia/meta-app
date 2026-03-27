import { NextResponse } from "next/server";

// Test endpoint to simulate webhook events for development
export async function POST(request) {
  try {
    const { type, data } = await request.json();

    console.log("🧪 Test webhook event:", type, data);

    // Simulate different webhook events
    switch (type) {
      case "message_template_status_update":
        const templatePayload = {
          object: "whatsapp_business_account",
          entry: [{
            id: "test_entry_id",
            changes: [{
              field: "message_template_status_update",
              value: {
                message_template_id: data.templateId || "test_template_123",
                message_template_name: data.templateName || "test_template",
                message_template_language: data.language || "en_US",
                previous_status: data.previousStatus || "PENDING",
                new_status: data.newStatus || "APPROVED",
                reason: data.reason || "Template meets all requirements",
                timestamp: new Date().toISOString()
              }
            }]
          }]
        };

        // Forward to main webhook handler
        const webhookResponse = await fetch(`${request.nextUrl.origin}/api/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templatePayload)
        });

        return NextResponse.json({
          success: true,
          message: "Template status update test sent",
          payload: templatePayload,
          webhookResponse: webhookResponse.status
        });

      case "message":
        const messagePayload = {
          object: "whatsapp_business_account",
          entry: [{
            id: "test_entry_id",
            changes: [{
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "1234567890",
                  phone_number_id: "test_phone_id"
                },
                contacts: [{
                  profile: {
                    name: data.contactName || "Test User"
                  },
                  wa_id: data.from || "1234567890"
                }],
                messages: [{
                  id: `test_msg_${Date.now()}`,
                  from: data.from || "1234567890",
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: data.message || "Hello! This is a test message from webhook v24.0" },
                  type: "text"
                }]
              }
            }]
          }]
        };

        const msgWebhookResponse = await fetch(`${request.nextUrl.origin}/api/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messagePayload)
        });

        return NextResponse.json({
          success: true,
          message: "Incoming message test sent",
          payload: messagePayload,
          webhookResponse: msgWebhookResponse.status
        });

      default:
        return NextResponse.json({
          success: false,
          message: "Unknown test type. Use 'message_template_status_update' or 'message'"
        }, { status: 400 });
    }

  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET endpoint to show test instructions
export async function GET() {
  return NextResponse.json({
    message: "Webhook Test Endpoint",
    usage: {
      endpoint: "/api/webhook/test",
      method: "POST",
      examples: {
        template_status_update: {
          type: "message_template_status_update",
          data: {
            templateId: "123456789",
            templateName: "welcome_message",
            language: "en_US",
            previousStatus: "PENDING",
            newStatus: "APPROVED",
            reason: "Template approved for use"
          }
        },
        message: {
          type: "message",
          data: {
            from: "1234567890",
            message: "Hello from test webhook!"
          }
        }
      }
    },
    version: "v24.0"
  });
}