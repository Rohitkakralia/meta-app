import { NextResponse } from "next/server";

// Send message via WhatsApp Business API
export async function POST(request) {
  try {
    const { to, message, type = "text" } = await request.json();

    if (!to || !message) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: to, message"
      }, { status: 400 });
    }

    // WhatsApp Business API endpoint
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // Development mode - simulate message sending without actual API
    if (isDevelopment && (!phoneNumberId || !accessToken)) {
      console.log("🧪 Development mode: Simulating message send");
      console.log("📤 Would send message:", { to, message, type });
      
      // Simulate API response
      const mockMessageId = `dev_msg_${Date.now()}`;
      
      // Store the message in conversation (for testing)
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/messages/conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: to,
            message: {
              id: mockMessageId,
              text: message,
              sender: "me",
              timestamp: Date.now(),
              status: "sent"
            }
          })
        });
      } catch (storeError) {
        console.error("Failed to store dev message:", storeError);
      }
      
      return NextResponse.json({
        success: true,
        messageId: mockMessageId,
        data: { 
          messages: [{ id: mockMessageId }],
          development: true,
          note: "Message simulated in development mode"
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Production mode - require actual API configuration
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({
        success: false,
        error: "Missing WhatsApp API configuration. Please set META_PHONE_NUMBER_ID and META_ACCESS_TOKEN environment variables.",
        requiredEnvVars: {
          META_PHONE_NUMBER_ID: "Your WhatsApp Business Phone Number ID",
          META_ACCESS_TOKEN: "Your WhatsApp Business API Access Token",
          META_WEBHOOK_VERIFY_TOKEN: "Your webhook verification token"
        }
      }, { status: 500 });
    }

    const url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;
    
    // Prepare message payload
    let messagePayload = {
      messaging_product: "whatsapp",
      to: to,
      type: type
    };

    // Handle different message types
    switch (type) {
      case "text":
        messagePayload.text = { body: message };
        break;
      case "template":
        messagePayload.template = message; // message should be template object
        break;
      default:
        messagePayload.text = { body: message };
    }

    console.log("📤 Sending message:", messagePayload);

    // Send message to WhatsApp API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messagePayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", result);
      return NextResponse.json({
        success: false,
        error: result.error?.message || "Failed to send message",
        details: result
      }, { status: response.status });
    }

    console.log("✅ Message sent successfully:", result);

    // Return success response with message ID
    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/messages/send",
    method: "POST",
    description: "Send messages via WhatsApp Business API v24.0",
    parameters: {
      to: "Recipient phone number (with country code, no +)",
      message: "Message text or template object",
      type: "Message type: 'text' or 'template' (default: 'text')"
    },
    example: {
      to: "1234567890",
      message: "Hello! This is a test message.",
      type: "text"
    },
    templateExample: {
      to: "1234567890",
      type: "template",
      message: {
        name: "hello_world",
        language: { code: "en_US" }
      }
    }
  });
}