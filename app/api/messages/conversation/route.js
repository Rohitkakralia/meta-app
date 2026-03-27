import { NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, use a proper database
let conversations = new Map();

// Get conversation messages
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get("phone");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: "Phone number is required"
      }, { status: 400 });
    }

    // Get messages for this conversation
    const conversationKey = phoneNumber;
    const messages = conversations.get(conversationKey) || [];
    
    // Apply pagination
    const paginatedMessages = messages
      .slice(offset, offset + limit)
      .sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json({
      success: true,
      data: {
        phoneNumber,
        messages: paginatedMessages,
        total: messages.length,
        hasMore: offset + limit < messages.length
      }
    });

  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Add message to conversation (used by webhook)
export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: "Phone number and message are required"
      }, { status: 400 });
    }

    const conversationKey = phoneNumber;
    const messages = conversations.get(conversationKey) || [];
    
    // Add new message
    const newMessage = {
      id: message.id || `msg_${Date.now()}`,
      text: message.text || "",
      sender: message.sender || "other", // "me" or "other"
      timestamp: message.timestamp || Date.now(),
      status: message.status || "received",
      type: message.type || "text",
      from: message.from || phoneNumber,
      to: message.to
    };

    messages.push(newMessage);
    conversations.set(conversationKey, messages);

    console.log(`💾 Stored message for ${phoneNumber}:`, newMessage);

    return NextResponse.json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    console.error("Store message error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Update message status
export async function PATCH(request) {
  try {
    const { phoneNumber, messageId, status } = await request.json();

    if (!phoneNumber || !messageId || !status) {
      return NextResponse.json({
        success: false,
        error: "Phone number, message ID, and status are required"
      }, { status: 400 });
    }

    const conversationKey = phoneNumber;
    const messages = conversations.get(conversationKey) || [];
    
    // Find and update message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].status = status;
      messages[messageIndex].updatedAt = Date.now();
      conversations.set(conversationKey, messages);

      console.log(`📊 Updated message ${messageId} status to ${status}`);

      return NextResponse.json({
        success: true,
        message: messages[messageIndex]
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Message not found"
      }, { status: 404 });
    }

  } catch (error) {
    console.error("Update message status error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}