"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Normalize a message from the conversation API into UI shape
const normalizeMessage = (msg) => ({
  id:        msg.id,
  text:      msg.text || (msg.type === "text" ? "[Message content unavailable]" : getMediaLabel(msg)),
  sender:    msg.direction === "outbound" ? "me" : "other",
  time:      new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  status:    msg.status ?? null,
  timestamp: msg.timestamp,
  type:      msg.type ?? "text",
  templateName: msg.templateName ?? null,
  // Pass through media properties for template messages
  image:     msg.image ?? null,
  video:     msg.video ?? null,
  document:  msg.document ?? null,
  audio:     msg.audio ?? null,
});

// Fallback label for non-text messages (image, audio, etc.)
const getMediaLabel = (msg) => {
  // For template messages, show template name with media type
  if (msg.templateName) {
    if (msg.image)    return `📷 Template: ${msg.templateName}`;
    if (msg.video)    return `🎬 Template: ${msg.templateName}`;
    if (msg.document) return `📄 Template: ${msg.templateName}`;
    return `📄 Template: ${msg.templateName}`;
  }
  
  // For regular media messages
  if (msg.image)    return "📷 Image";
  if (msg.audio)    return "🎵 Audio";
  if (msg.video)    return "🎬 Video";
  if (msg.document) return "📄 Document";
  if (msg.sticker)  return "🪄 Sticker";
  if (msg.location) return "📍 Location";
  return "[Unsupported message]";
};

const ChatRoom = ({ contact, onBack }) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [sendError, setSendError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef  = useRef(null);
  const intervalRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation from the API and merge into state
  const fetchMessages = useCallback(async () => {
    if (!contact?.phone) return;
    try {
      const res  = await fetch(
        `/api/whatsapp/conversation?phone=${encodeURIComponent(contact.phone)}`
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.messages)) {
        // Debug: log raw messages to see what we're getting
        console.log("[ChatRoom] Raw messages from API:", data.messages);
        
        const normalized = data.messages.map(normalizeMessage);
        setMessages((prev) => {
          // Only update if something actually changed (avoid flicker)
          const prevIds = prev.map((m) => m.id + m.status).join();
          const nextIds = normalized.map((m) => m.id + m.status).join();
          return prevIds === nextIds ? prev : normalized;
        });
      }
    } catch (err) {
      console.error("[ChatRoom] fetchMessages error:", err);
    }
  }, [contact?.phone]);

  // Initial load + polling every 2 s
  useEffect(() => {
    if (!contact?.phone) return;

    setLoading(true);
    setMessages([]);

    fetchMessages().finally(() => setLoading(false));

    intervalRef.current = setInterval(() => {
      if (!isSending) fetchMessages();   // pause poll while optimistic send is in flight
    }, 2000);

    return () => clearInterval(intervalRef.current);
  }, [contact?.phone, fetchMessages]);  // isSending intentionally excluded — see note below

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const messageText = input.trim();
    const tempId      = `temp_${Date.now()}`;

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        id:        tempId,
        text:      messageText,
        sender:    "me",
        time:      new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status:    "sending",
        timestamp: Date.now(),
        type:      "text",
      },
    ]);
    setInput("");
    setSendError(null);
    setIsSending(true);

    try {
      const res  = await fetch("/api/whatsapp/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          contacts: [{ id: contact.id, phone: contact.phone, name: contact.name }],
          text:     messageText,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.sent === 0) {
        setSendError(data.error || "Failed to send message");
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
      } else {
        // Replace temp message with real one from the server after a short delay
        // (gives messageStore.save() time to persist before the next poll)
        setTimeout(fetchMessages, 500);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
        );
      }
    } catch (err) {
      setSendError("Network error. Please try again.");
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sending":   return "⏳";
      case "sent":      return "✓";
      case "delivered": return "✓✓";
      case "read":      return "✓✓";
      case "failed":    return "❌";
      default:          return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sending":   return "text-yellow-400";
      case "sent":      return "text-gray-400";
      case "delivered": return "text-blue-400";
      case "read":      return "text-green-400"; // Green for read to distinguish from delivered
      case "failed":    return "text-red-400";
      default:          return "text-gray-400";
    }
  };

  const renderMessage = (msg) => (
    <div
      key={msg.id}
      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words
          ${
            msg.sender === "me"
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-[#16161e] text-gray-200 rounded-bl-md"
          }`}
      >
        {/* Template badge */}
        {msg.templateName && (
          <div className="text-[10px] opacity-60 mb-2 flex items-center gap-1">
            📄 Template: <span className="font-mono">{msg.templateName}</span>
          </div>
        )}

        {/* Template Media Display */}
        {msg.templateName && (msg.image || msg.video || msg.document) && (
          <div className="mb-3">
            {msg.image && msg.image.url && (
              <img 
                src={msg.image.url} 
                alt="Template image"
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            )}
            {msg.image && msg.image.url && (
              <div className="hidden text-xs text-gray-400 bg-gray-700 p-2 rounded">
                📷 Template Image (Unable to load)
              </div>
            )}
            
            {msg.video && msg.video.url && (
              <video 
                controls 
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              >
                <source src={msg.video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {msg.video && msg.video.url && (
              <div className="hidden text-xs text-gray-400 bg-gray-700 p-2 rounded">
                🎬 Template Video (Unable to load)
              </div>
            )}
            
            {msg.document && msg.document.url && (
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <div>
                    <div className="text-sm font-medium">
                      {msg.document.filename || 'Template Document'}
                    </div>
                    <a 
                      href={msg.document.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Download Document
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message content with proper line breaks for templates */}
        <div className="whitespace-pre-line">{msg.text}</div>

        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-300 mt-1">
          <span>{msg.time}</span>
          {msg.sender === "me" && msg.status && (
            <span className={getStatusColor(msg.status)}>
              {getStatusIcon(msg.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[80vh] text-white">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2a]">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#16161e] transition text-gray-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="text-xs text-gray-500 animate-pulse">Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-xs text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {sendError && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-xs text-red-300 flex justify-between">
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} className="ml-2 text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#1e1e2a]">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-500"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={isSending || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium transition text-white"
          >
            {isSending ? "…" : "Send"}
          </button>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-1">Polls every 2 s for new messages</p>
      </div>
    </div>
  );
};

export default ChatRoom;