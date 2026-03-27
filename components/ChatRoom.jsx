"use client";
import React, { useEffect, useRef, useState } from "react";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ChatRoom = ({ contact, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [templateStatus, setTemplateStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [loading, setLoading] = useState(true);
  const [apiConfig, setApiConfig] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load API configuration status
  useEffect(() => {
    const checkApiConfig = async () => {
      try {
        const response = await fetch("/api/config/status");
        const result = await response.json();
        setApiConfig(result.config);
      } catch (error) {
        console.error("Failed to check API config:", error);
      }
    };
    checkApiConfig();
  }, []);

  // Load conversation history when contact changes
  useEffect(() => {
    if (contact?.phone) {
      loadConversation();
      setConnectionStatus("connected");
    }
  }, [contact]);

  // Load conversation history
  const loadConversation = async () => {
    if (!contact?.phone) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/messages/conversation?phone=${encodeURIComponent(contact.phone)}`
      );
      const result = await response.json();

      if (result.success && result.data.messages) {
        // Convert API messages to UI format
        const formattedMessages = result.data.messages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          time: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: msg.status,
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
      } else {
        // No existing conversation, start with empty messages
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setMessages([]);
    }
    setLoading(false);
  };

  // Real-time message polling (in production, use WebSocket or SSE)
  useEffect(() => {
    if (!contact?.phone) return;

    const pollMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages/conversation?phone=${encodeURIComponent(
            contact.phone
          )}`
        );
        const result = await response.json();

        if (result.success && result.data.messages) {
          const formattedMessages = result.data.messages.map((msg) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            time: new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: msg.status,
            timestamp: msg.timestamp,
          }));

          // Only update if messages changed
          setMessages((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(formattedMessages)) {
              return formattedMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
        setConnectionStatus("error");
      }
    };

    // Poll every 2 seconds for new messages
    const interval = setInterval(pollMessages, 2000);
    return () => clearInterval(interval);
  }, [contact]);

  // Send message via API
  const sendMessage = async () => {
    if (!input.trim() || !contact?.phone) return;

    const messageText = input.trim();
    const tempId = `temp_${Date.now()}`;

    // Add message to UI immediately (optimistic update)
    const newMessage = {
      id: tempId,
      text: messageText,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      // Send via WhatsApp API
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.phone.replace(/\D/g, ""), // Remove non-digits
          message: messageText,
          type: "text",
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update message with real ID and sent status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { 
                  ...msg, 
                  id: result.messageId, 
                  status: result.data?.development ? "sent (dev)" : "sent" 
                }
              : msg
          )
        );

        // Store in conversation history
        await fetch("/api/messages/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: contact.phone,
            message: {
              id: result.messageId,
              text: messageText,
              sender: "me",
              timestamp: Date.now(),
              status: result.data?.development ? "sent (dev)" : "sent",
            },
          }),
        });

        if (result.data?.development) {
          console.log("🧪 Message simulated in development mode");
        } else {
          console.log("✅ Message sent successfully");
        }
      } else {
        // Update message status to failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg
          )
        );
        
        // Show user-friendly error message
        if (result.error?.includes("Missing WhatsApp API configuration")) {
          console.error("⚠️ WhatsApp API not configured. Running in development mode.");
        } else {
          console.error("Failed to send message:", result.error);
        }
      }
    } catch (error) {
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg
        )
      );
      console.error("Send message error:", error);
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sending":
        return "⏳";
      case "sent":
        return "✓";
      case "sent (dev)":
        return "🧪";
      case "delivered":
        return "✓✓";
      case "read":
        return "✓✓";
      case "failed":
        return "❌";
      default:
        return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sending":
        return "text-yellow-400";
      case "sent":
        return "text-gray-400";
      case "sent (dev)":
        return "text-purple-400";
      case "delivered":
        return "text-blue-400";
      case "read":
        return "text-blue-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const renderMessage = (msg) => {
    if (msg.type === "template_status") {
      return (
        <div key={msg.id} className="flex justify-center mb-3">
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-2 text-xs text-blue-300 max-w-[80%] text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span>📄</span>
              <span className="font-semibold">Template Status Update</span>
            </div>
            <div>Template: {msg.templateUpdate.messageTemplateName}</div>
            <div>
              Status: {msg.templateUpdate.previousStatus} →{" "}
              {msg.templateUpdate.newStatus}
            </div>
            {msg.templateUpdate.reason && (
              <div className="text-xs text-blue-400 mt-1">
                Reason: {msg.templateUpdate.reason}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">{msg.time}</div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        className={`flex ${
          msg.sender === "me" ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm
            ${
              msg.sender === "me"
                ? "bg-indigo-600 text-white rounded-br-md"
                : "bg-[#16161e] text-gray-200 rounded-bl-md"
            }`}
        >
          {msg.text}
          <div className="flex items-center justify-between text-[10px] text-gray-300 mt-1">
            <span>{msg.time}</span>
            {msg.sender === "me" && msg.status && (
              <span className={`ml-2 ${getStatusColor(msg.status)}`}>
                {getMessageStatusIcon(msg.status)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[80vh] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        {/* Back button */}
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#16161e] transition text-gray-400"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm text-white"
          style={{ background: "#5F27CD" }}
        >
          {getInitials(contact?.name)}
        </div>

        <div className="flex-1">
          <div className="text-sm font-semibold">{contact?.name}</div>
          <div className="text-xs text-gray-500">{contact?.phone}</div>
        </div>

        {/* Webhook Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected" ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <span className="text-xs text-gray-400">
            {connectionStatus === "connected" ? "Live" : "Offline"}
          </span>
          {apiConfig?.developmentMode && (
            <span className="text-xs text-purple-400 ml-2">🧪 Dev</span>
          )}
        </div>
      </div>

      {/* API Configuration Banner */}
      {apiConfig?.developmentMode && (
        <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-700">
          <div className="text-xs text-purple-300 flex items-center gap-2">
            <span>🧪</span>
            Development Mode: Messages are simulated (not actually sent via WhatsApp)
            <a 
              href="/WHATSAPP_API_SETUP.md" 
              target="_blank"
              className="text-purple-400 hover:text-purple-300 underline ml-2"
            >
              Setup Guide
            </a>
          </div>
        </div>
      )}

      {/* Template Status Banner */}
      {templateStatus && (
        <div className="px-4 py-2 bg-blue-900/20 border-b border-blue-700">
          <div className="text-xs text-blue-300">
            📄 Latest Template: {templateStatus.messageTemplateName} -{" "}
            {templateStatus.newStatus}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400 text-sm">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="text-gray-400">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm">Start a conversation</div>
              <div className="text-xs text-gray-500 mt-1">
                Messages will appear here in real-time
              </div>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1e1e2a]">
        <div className="flex items-center gap-2 bg-[#fff] rounded-xl px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-500"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Send
          </button>
        </div>

        {/* Webhook Info */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          Webhook v24.0 • Real-time messaging & template status updates
          {apiConfig?.developmentMode && (
            <span className="text-purple-400"> • Development Mode</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
